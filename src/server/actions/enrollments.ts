"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  bundleEnrollments,
  bundles,
  courseLocks,
  enrollments,
  profiles,
  programSemesters,
  users,
} from "@/db/schema"
import { grantBundleAccess, grantProgramEnrollment } from "@/lib/access"
import { sendNotificationEmail } from "@/lib/email"
import { requireActionRole } from "@/lib/auth/server"
import { addDays } from "@/lib/format"
import { grantEnrollmentSchema, updateSemesterEnrollmentSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function refreshEnrollments(studentId?: string) {
  revalidatePath("/admin/enrollments")
  revalidatePath("/admin/students")
  revalidatePath("/dashboard")
  if (studentId) revalidatePath(`/admin/students/${studentId}`)
}

export async function grantEnrollmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = grantEnrollmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { studentId, programId, bundleId, accessDurationDays } = parsed.data

  try {
    const db = getDb()
    const [student] = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email,
        firstName: profiles.firstName,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, studentId))
      .limit(1)
    if (!student || student.role !== "STUDENT") return failure("Select a valid student.")

    const [bundleInfo] = await db
      .select({ title: bundles.title })
      .from(bundles)
      .where(eq(bundles.id, bundleId))
      .limit(1)

    const [semester] = await db
      .select({ number: programSemesters.number })
      .from(programSemesters)
      .where(
        and(eq(programSemesters.programId, programId), eq(programSemesters.bundleId, bundleId))
      )
      .limit(1)
    if (!semester) return failure("That semester is not part of the selected program.")

    const links = await db
      .select({ courseId: bundleCourses.courseId })
      .from(bundleCourses)
      .where(eq(bundleCourses.bundleId, bundleId))

    await grantBundleAccess({
      studentId,
      bundleId,
      courseIds: links.map((l) => l.courseId),
      source: "ADMIN_GRANT",
      accessDurationDays,
    })

    await grantProgramEnrollment({
      studentId,
      programId,
      currentSemester: semester.number,
    })

    await sendNotificationEmail(student.email, {
      title: "Semester assigned",
      body: `You have been assigned to ${bundleInfo?.title ?? "a semester"}. You can start learning now.`,
      url: "/dashboard/program",
    })

    refreshEnrollments(studentId)
    return success("Student assigned to the program and semester.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateSemesterEnrollmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const studentId = String(formData.get("studentId") ?? "")
  const bundleId = String(formData.get("bundleId") ?? "")
  const parsed = updateSemesterEnrollmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  if (!studentId || !bundleId) return failure("Missing enrollment.")

  try {
    const db = getDb()
    const { status, accessDurationDays } = parsed.data
    const expiresAt =
      status === "ACTIVE"
        ? accessDurationDays === null
          ? null
          : addDays(new Date(), accessDurationDays)
        : undefined

    await db
      .update(bundleEnrollments)
      .set({ status, expiresAt, updatedAt: new Date() })
      .where(
        and(eq(bundleEnrollments.studentId, studentId), eq(bundleEnrollments.bundleId, bundleId))
      )
    await db
      .update(enrollments)
      .set({ status, expiresAt, updatedAt: new Date() })
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.bundleId, bundleId)))

    refreshEnrollments(studentId)
    return success("Semester enrollment updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function revokeSemesterEnrollmentAction(
  studentId: string,
  bundleId: string
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db
      .update(bundleEnrollments)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(
        and(eq(bundleEnrollments.studentId, studentId), eq(bundleEnrollments.bundleId, bundleId))
      )
    await db
      .update(enrollments)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.bundleId, bundleId)))
    refreshEnrollments(studentId)
    return success("Semester access revoked.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function lockCourseAction(
  studentId: string,
  courseId: string,
  reason?: string
): Promise<ActionState> {
  try {
    const admin = await requireActionRole("ADMIN")
    const db = getDb()
    const [existing] = await db
      .select({ id: courseLocks.id })
      .from(courseLocks)
      .where(and(eq(courseLocks.studentId, studentId), eq(courseLocks.courseId, courseId)))
      .limit(1)
    if (!existing) {
      await db.insert(courseLocks).values({
        studentId,
        courseId,
        lockedBy: admin.id,
        reason: reason?.trim() ? reason.trim() : null,
      })
    }
    refreshEnrollments(studentId)
    return success("Course locked for this student.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function unlockCourseAction(
  studentId: string,
  courseId: string
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db
      .delete(courseLocks)
      .where(and(eq(courseLocks.studentId, studentId), eq(courseLocks.courseId, courseId)))
    refreshEnrollments(studentId)
    return success("Course unlocked for this student.")
  } catch (error) {
    return toActionError(error)
  }
}
