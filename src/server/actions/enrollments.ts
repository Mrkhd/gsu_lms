"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  bundles,
  enrollments,
  programSemesters,
  users,
} from "@/db/schema"
import { grantBundleAccess, grantCourseEnrollment, grantProgramEnrollment } from "@/lib/access"
import { requireActionRole } from "@/lib/auth/server"
import { addDays } from "@/lib/format"
import { grantEnrollmentSchema, updateEnrollmentSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function refreshEnrollments() {
  revalidatePath("/admin/enrollments")
  revalidatePath("/admin/students")
  revalidatePath("/dashboard")
}

export async function grantEnrollmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = grantEnrollmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { studentId, courseId, bundleId, accessDurationDays } = parsed.data

  try {
    const db = getDb()
    const [student] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1)
    if (!student || student.role !== "STUDENT") return failure("Select a valid student.")

    if (bundleId) {
      const [bundle] = await db
        .select({ id: bundles.id })
        .from(bundles)
        .where(eq(bundles.id, bundleId))
        .limit(1)
      if (!bundle) return failure("Bundle not found.")
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

      const [semester] = await db
        .select({ programId: programSemesters.programId, number: programSemesters.number })
        .from(programSemesters)
        .where(eq(programSemesters.bundleId, bundleId))
        .limit(1)
      if (semester) {
        await grantProgramEnrollment({
          studentId,
          programId: semester.programId,
          currentSemester: semester.number,
        })
      }
    } else if (courseId) {
      await grantCourseEnrollment({ studentId, courseId, source: "ADMIN_GRANT", accessDurationDays })
    }

    refreshEnrollments()
    return success("Enrollment granted.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateEnrollmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const enrollmentId = String(formData.get("enrollmentId") ?? "")
  const parsed = updateEnrollmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)

  try {
    const db = getDb()
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1)
    if (!enrollment) return failure("Enrollment not found.")

    const { status, accessDurationDays } = parsed.data
    await db
      .update(enrollments)
      .set({
        status,
        expiresAt:
          status === "ACTIVE"
            ? accessDurationDays === null
              ? null
              : addDays(new Date(), accessDurationDays)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollmentId))
    refreshEnrollments()
    return success("Enrollment updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function revokeEnrollmentAction(enrollmentId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db
      .update(enrollments)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentId))
    refreshEnrollments()
    return success("Enrollment revoked.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function revokeBundleEnrollmentAction(
  studentId: string,
  bundleId: string
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db
      .update(enrollments)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(enrollments.studentId, studentId), eq(enrollments.bundleId, bundleId)))
    refreshEnrollments()
    return success("Bundle access revoked.")
  } catch (error) {
    return toActionError(error)
  }
}
