"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { assignmentSubmissions, assignments, courses } from "@/db/schema"
import { mediaKey, putObject } from "@/db/storage"
import { getCourseAccess } from "@/lib/access"
import { requireActionRole, requireActionUser } from "@/lib/auth/server"
import { assignmentSchema, gradeSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

const MAX_PDF_BYTES = 20 * 1024 * 1024

async function assertManageableCourse(courseId: string) {
  const user = await requireActionRole("ADMIN", "INSTRUCTOR")
  const db = getDb()
  const [course] = await db
    .select({ id: courses.id, instructorId: courses.instructorId, slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
  if (!course) throw new Error("Course not found.")
  if (user.role !== "ADMIN" && course.instructorId !== user.id) {
    throw new Error("You do not have permission to manage this course.")
  }
  return { course, user }
}

function refreshCourse(courseId: string, slug: string) {
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath(`/instructor/courses/${courseId}`)
  revalidatePath(`/learn/${slug}/assignments`)
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export async function createAssignmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const courseId = String(formData.get("courseId") ?? "")
  const parsed = assignmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  try {
    const { course } = await assertManageableCourse(courseId)
    const db = getDb()
    await db.insert(assignments).values({
      courseId: course.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueAt: parsed.data.dueAt,
      maxPoints: parsed.data.maxPoints,
    })
    refreshCourse(course.id, course.slug)
    return success("Assignment created.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateAssignmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const assignmentId = String(formData.get("assignmentId") ?? "")
  const parsed = assignmentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  try {
    const db = getDb()
    const [assignment] = await db
      .select({ id: assignments.id, courseId: assignments.courseId })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1)
    if (!assignment) return failure("Assignment not found.")
    const { course } = await assertManageableCourse(assignment.courseId)
    await db
      .update(assignments)
      .set({
        title: parsed.data.title,
        description: parsed.data.description || null,
        dueAt: parsed.data.dueAt,
        maxPoints: parsed.data.maxPoints,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignment.id))
    refreshCourse(course.id, course.slug)
    return success("Assignment saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteAssignmentAction(assignmentId: string): Promise<ActionState> {
  try {
    const db = getDb()
    const [assignment] = await db
      .select({ id: assignments.id, courseId: assignments.courseId })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1)
    if (!assignment) return failure("Assignment not found.")
    const { course } = await assertManageableCourse(assignment.courseId)
    await db.delete(assignments).where(eq(assignments.id, assignment.id))
    refreshCourse(course.id, course.slug)
    return success("Assignment deleted.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function submitAssignmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireActionUser()
  const assignmentId = String(formData.get("assignmentId") ?? "")
  try {
    const db = getDb()
    const [assignment] = await db
      .select({ id: assignments.id, courseId: assignments.courseId })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1)
    if (!assignment) return failure("Assignment not found.")

    const access = await getCourseAccess(user.id, assignment.courseId)
    if (!access.hasAccess) return failure("Your access to this course has expired.")

    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return failure("Choose a PDF file to upload.")
    if (!isPdf(file)) return failure("Please upload a PDF file.")
    if (file.size > MAX_PDF_BYTES) return failure("PDF must be 20 MB or smaller.")

    const key = mediaKey(`submissions/${assignment.id}`, file.name)
    await putObject(key, await file.arrayBuffer(), {
      contentType: "application/pdf",
    })

    await db
      .insert(assignmentSubmissions)
      .values({
        assignmentId: assignment.id,
        studentId: user.id,
        courseId: assignment.courseId,
        fileKey: key,
        fileName: file.name,
        submittedAt: new Date(),
        status: "SUBMITTED",
      })
      .onConflictDoUpdate({
        target: [assignmentSubmissions.assignmentId, assignmentSubmissions.studentId],
        set: {
          fileKey: key,
          fileName: file.name,
          submittedAt: new Date(),
          status: "SUBMITTED",
          grade: null,
          feedback: null,
          gradedAt: null,
          gradedById: null,
          updatedAt: new Date(),
        },
      })

    const [course] = await db
      .select({ slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, assignment.courseId))
      .limit(1)
    if (course) refreshCourse(assignment.courseId, course.slug)
    return success("Assignment submitted.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function gradeSubmissionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = gradeSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  try {
    await requireActionRole("ADMIN", "INSTRUCTOR")
    const db = getDb()
    const [submission] = await db
      .select({ id: assignmentSubmissions.id, courseId: assignmentSubmissions.courseId })
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.id, parsed.data.submissionId))
      .limit(1)
    if (!submission) return failure("Submission not found.")
    const { course, user } = await assertManageableCourse(submission.courseId)

    await db
      .update(assignmentSubmissions)
      .set({
        grade: parsed.data.grade,
        feedback: parsed.data.feedback || null,
        status: "GRADED",
        gradedAt: new Date(),
        gradedById: user.id,
        updatedAt: new Date(),
      })
      .where(eq(assignmentSubmissions.id, submission.id))

    refreshCourse(course.id, course.slug)
    return success("Grade saved.")
  } catch (error) {
    return toActionError(error)
  }
}
