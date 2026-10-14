import { and, eq, notInArray } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  bundleEnrollments,
  bundles,
  courseLocks,
  enrollments,
  programEnrollments,
} from "@/db/schema"
import type { EnrollmentSource, EnrollmentStatus } from "@/db/types"
import { addDays, daysRemaining } from "@/lib/format"

export type EnrollmentWindow = {
  status: EnrollmentStatus
  expiresAt: Date | null
}

/**
 * The single access rule used everywhere:
 *   status === ACTIVE AND (expires_at IS NULL OR expires_at > NOW())
 */
export function isEnrollmentActive(enrollment: EnrollmentWindow | null | undefined): boolean {
  if (!enrollment) return false
  if (enrollment.status !== "ACTIVE") return false
  if (enrollment.expiresAt && enrollment.expiresAt.getTime() <= Date.now()) return false
  return true
}

export type AccessReason = "ACTIVE" | "EXPIRED" | "CANCELLED" | "LOCKED" | "NONE"

export type CourseAccess = {
  hasAccess: boolean
  reason: AccessReason
  daysLeft: number | null
  enrollment: {
    id: string
    status: EnrollmentStatus
    source: EnrollmentSource
    startedAt: Date
    expiresAt: Date | null
  } | null
}

export async function getCourseAccess(
  studentId: string,
  courseId: string
): Promise<CourseAccess> {
  const db = getDb()
  const [enrollment] = await db
    .select({
      id: enrollments.id,
      status: enrollments.status,
      source: enrollments.source,
      startedAt: enrollments.startedAt,
      expiresAt: enrollments.expiresAt,
    })
    .from(enrollments)
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.courseId, courseId)))
    .limit(1)

  const [lock] = await db
    .select({ id: courseLocks.id })
    .from(courseLocks)
    .where(and(eq(courseLocks.studentId, studentId), eq(courseLocks.courseId, courseId)))
    .limit(1)

  if (lock) {
    return { hasAccess: false, reason: "LOCKED", daysLeft: 0, enrollment: enrollment ?? null }
  }

  if (!enrollment) {
    return { hasAccess: false, reason: "NONE", daysLeft: null, enrollment: null }
  }
  if (enrollment.status === "CANCELLED") {
    return { hasAccess: false, reason: "CANCELLED", daysLeft: 0, enrollment }
  }
  if (!isEnrollmentActive(enrollment)) {
    return { hasAccess: false, reason: "EXPIRED", daysLeft: 0, enrollment }
  }
  return {
    hasAccess: true,
    reason: "ACTIVE",
    daysLeft: daysRemaining(enrollment.expiresAt),
    enrollment,
  }
}

/** Set of course ids explicitly locked for a student by an administrator. */
export async function getCourseLocks(studentId: string): Promise<Set<string>> {
  const db = getDb()
  const rows = await db
    .select({ courseId: courseLocks.courseId })
    .from(courseLocks)
    .where(eq(courseLocks.studentId, studentId))
  return new Set(rows.map((row) => row.courseId))
}

export async function getBundleAccess(
  studentId: string,
  bundleId: string
): Promise<CourseAccess> {
  const db = getDb()
  const [enrollment] = await db
    .select({
      id: bundleEnrollments.id,
      status: bundleEnrollments.status,
      source: bundleEnrollments.source,
      startedAt: bundleEnrollments.startedAt,
      expiresAt: bundleEnrollments.expiresAt,
    })
    .from(bundleEnrollments)
    .where(
      and(eq(bundleEnrollments.studentId, studentId), eq(bundleEnrollments.bundleId, bundleId))
    )
    .limit(1)

  if (!enrollment) return { hasAccess: false, reason: "NONE", daysLeft: null, enrollment: null }
  if (enrollment.status === "CANCELLED")
    return { hasAccess: false, reason: "CANCELLED", daysLeft: 0, enrollment }
  if (!isEnrollmentActive(enrollment))
    return { hasAccess: false, reason: "EXPIRED", daysLeft: 0, enrollment }
  return {
    hasAccess: true,
    reason: "ACTIVE",
    daysLeft: daysRemaining(enrollment.expiresAt),
    enrollment,
  }
}

/** Lifetime (null) always wins; otherwise the later date wins. */
export function resolveExpiration(current: Date | null, incoming: Date | null): Date | null {
  if (current === null || incoming === null) return null
  return current.getTime() >= incoming.getTime() ? current : incoming
}

export type GrantInput = {
  studentId: string
  courseId: string
  source: EnrollmentSource
  sourceId?: string | null
  bundleId?: string | null
  /** null = lifetime access */
  accessDurationDays: number | null
  startAt?: Date
}

/**
 * Grants (or extends) course access, applying the MVP business rule:
 * the resulting expiration is the later of the existing and the new expiration.
 * Lifetime access always wins.
 */
export async function grantCourseEnrollment(input: GrantInput) {
  const db = getDb()
  const startAt = input.startAt ?? new Date()
  const incomingExpiry =
    input.accessDurationDays === null ? null : addDays(startAt, input.accessDurationDays)

  const [existing] = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.studentId, input.studentId), eq(enrollments.courseId, input.courseId))
    )
    .limit(1)

  if (!existing) {
    const [created] = await db
      .insert(enrollments)
      .values({
        studentId: input.studentId,
        courseId: input.courseId,
        bundleId: input.bundleId ?? null,
        source: input.source,
        sourceId: input.sourceId ?? null,
        startedAt: startAt,
        expiresAt: incomingExpiry,
        status: "ACTIVE",
      })
      .returning()
    return created
  }

  if (isEnrollmentActive(existing)) {
    const expiresAt = resolveExpiration(existing.expiresAt, incomingExpiry)
    const [updated] = await db
      .update(enrollments)
      .set({
        expiresAt,
        status: "ACTIVE",
        bundleId: existing.bundleId ?? input.bundleId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, existing.id))
      .returning()
    return updated
  }

  const [updated] = await db
    .update(enrollments)
    .set({
      status: "ACTIVE",
      startedAt: startAt,
      expiresAt: incomingExpiry,
      source: input.source,
      sourceId: input.sourceId ?? null,
      bundleId: input.bundleId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(enrollments.id, existing.id))
    .returning()
  return updated
}

export type BundleGrantInput = {
  studentId: string
  bundleId: string
  courseIds: string[]
  source: EnrollmentSource
  sourceId?: string | null
  /** null = lifetime access */
  accessDurationDays: number | null
  startAt?: Date
}

/** Creates a bundle enrollment and derives course enrollments for every included course. */
export async function grantBundleAccess(input: BundleGrantInput) {
  const db = getDb()
  const startAt = input.startAt ?? new Date()
  const incomingExpiry =
    input.accessDurationDays === null ? null : addDays(startAt, input.accessDurationDays)

  const [existing] = await db
    .select()
    .from(bundleEnrollments)
    .where(
      and(
        eq(bundleEnrollments.studentId, input.studentId),
        eq(bundleEnrollments.bundleId, input.bundleId)
      )
    )
    .limit(1)

  if (!existing) {
    await db.insert(bundleEnrollments).values({
      studentId: input.studentId,
      bundleId: input.bundleId,
      source: input.source,
      sourceId: input.sourceId ?? null,
      startedAt: startAt,
      expiresAt: incomingExpiry,
      status: "ACTIVE",
    })
  } else {
    const active = isEnrollmentActive(existing)
    const expiresAt = active ? resolveExpiration(existing.expiresAt, incomingExpiry) : incomingExpiry
    await db
      .update(bundleEnrollments)
      .set({
        status: "ACTIVE",
        startedAt: active ? existing.startedAt : startAt,
        expiresAt,
        source: active ? existing.source : input.source,
        updatedAt: new Date(),
      })
      .where(eq(bundleEnrollments.id, existing.id))
  }

  await syncBundleCourseEnrollments(input.bundleId)
}

/**
 * Reconciles the derived per-course enrollments for a bundle with its current
 * course list, so students enrolled in the bundle gain newly added courses and
 * lose removed ones. Expiry/status mirror each student's bundle enrollment.
 */
export async function syncBundleCourseEnrollments(bundleId: string) {
  const db = getDb()
  const [bundle] = await db
    .select({ id: bundles.id })
    .from(bundles)
    .where(eq(bundles.id, bundleId))
    .limit(1)
  if (!bundle) return

  const links = await db
    .select({ courseId: bundleCourses.courseId })
    .from(bundleCourses)
    .where(eq(bundleCourses.bundleId, bundleId))
  const courseIds = links.map((link) => link.courseId)

  // Drop derived enrollments for courses that are no longer in the bundle.
  if (courseIds.length === 0) {
    await db.delete(enrollments).where(eq(enrollments.bundleId, bundleId))
  } else {
    await db
      .delete(enrollments)
      .where(and(eq(enrollments.bundleId, bundleId), notInArray(enrollments.courseId, courseIds)))
  }

  const students = await db
    .select()
    .from(bundleEnrollments)
    .where(eq(bundleEnrollments.bundleId, bundleId))

  for (const student of students) {
    for (const courseId of courseIds) {
      const [existing] = await db
        .select({ id: enrollments.id, bundleId: enrollments.bundleId })
        .from(enrollments)
        .where(and(eq(enrollments.studentId, student.studentId), eq(enrollments.courseId, courseId)))
        .limit(1)

      if (!existing) {
        await db.insert(enrollments).values({
          studentId: student.studentId,
          courseId,
          bundleId,
          source: student.source,
          sourceId: student.sourceId ?? null,
          startedAt: student.startedAt,
          expiresAt: student.expiresAt,
          status: student.status,
        })
      } else if (existing.bundleId === bundleId) {
        await db
          .update(enrollments)
          .set({ status: student.status, expiresAt: student.expiresAt, updatedAt: new Date() })
          .where(eq(enrollments.id, existing.id))
      }
    }
  }
}

// ---------------------------------------------------------------------------
// University programs
// ---------------------------------------------------------------------------

export type ProgramAccess = {
  enrolled: boolean
  status: EnrollmentStatus | null
  currentSemester: number | null
}

export async function getProgramAccess(
  studentId: string,
  programId: string
): Promise<ProgramAccess> {
  const db = getDb()
  const [enrollment] = await db
    .select({ status: programEnrollments.status, currentSemester: programEnrollments.currentSemester })
    .from(programEnrollments)
    .where(
      and(eq(programEnrollments.studentId, studentId), eq(programEnrollments.programId, programId))
    )
    .limit(1)

  if (!enrollment) return { enrolled: false, status: null, currentSemester: null }
  return {
    enrolled: enrollment.status === "ACTIVE",
    status: enrollment.status,
    currentSemester: enrollment.currentSemester,
  }
}

export type ProgramGrantInput = {
  studentId: string
  programId: string
  currentSemester?: number
}

/** Registers a student in a program (idempotent). */
export async function grantProgramEnrollment(input: ProgramGrantInput) {
  const db = getDb()
  const semester = input.currentSemester ?? 1
  const [existing] = await db
    .select()
    .from(programEnrollments)
    .where(
      and(
        eq(programEnrollments.studentId, input.studentId),
        eq(programEnrollments.programId, input.programId)
      )
    )
    .limit(1)

  if (!existing) {
    const [created] = await db
      .insert(programEnrollments)
      .values({
        studentId: input.studentId,
        programId: input.programId,
        status: "ACTIVE",
        currentSemester: semester,
      })
      .returning()
    return created
  }

  const [updated] = await db
    .update(programEnrollments)
    .set({
      status: "ACTIVE",
      currentSemester: Math.max(existing.currentSemester, semester),
      updatedAt: new Date(),
    })
    .where(eq(programEnrollments.id, existing.id))
    .returning()
  return updated
}
