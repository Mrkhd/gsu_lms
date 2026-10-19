"use server"

import { and, eq, gt, isNull, or } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses, enrollments, users } from "@/db/schema"
import { requireActionRole } from "@/lib/auth/server"
import {
  chunkRecipients,
  emailLayout,
  escapeHtml,
  instructorAddress,
  sendEmail,
} from "@/lib/email"
import { emailStudentSchema, emailStudentsSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function senderIdentity(sender: { firstName: string | null; lastName: string | null; email: string }) {
  const alias = instructorAddress({ firstName: sender.firstName, email: sender.email })
  const displayName =
    [sender.firstName, sender.lastName].filter(Boolean).join(" ") || "Instructor"
  return { alias, from: `${displayName} <${alias}>` }
}

export async function emailCourseStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sender = await requireActionRole("ADMIN", "INSTRUCTOR")
  const parsed = emailStudentSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { courseId, studentId, subject, message } = parsed.data

  try {
    const db = getDb()
    const [course] = await db
      .select({ id: courses.id, title: courses.title, instructorId: courses.instructorId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
    if (!course) return failure("Course not found.")
    if (sender.role !== "ADMIN" && course.instructorId !== sender.id) {
      return failure("You do not have permission to email this course.")
    }

    const [enrollment] = await db
      .select({ email: users.email })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(
        and(eq(enrollments.courseId, courseId), eq(enrollments.studentId, studentId))
      )
      .limit(1)
    if (!enrollment) return failure("That student is not enrolled in this course.")

    const { alias, from } = senderIdentity(sender)
    const html = emailLayout(
      subject,
      `<p style="font-size:14px;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</p>
       <p style="margin-top:16px;font-size:12px;color:#666">Sent by your instructor for ${escapeHtml(course.title)}.</p>`
    )

    const result = await sendEmail({
      from,
      to: enrollment.email,
      subject,
      html,
      text: message,
      replyTo: alias,
    })
    if (!result.ok) {
      return failure("The email could not be sent. Check the email configuration.")
    }
    return success(`Email sent to ${enrollment.email}.`)
  } catch (error) {
    return toActionError(error)
  }
}

export async function emailCourseStudentsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sender = await requireActionRole("ADMIN", "INSTRUCTOR")
  const parsed = emailStudentsSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { courseId, subject, message } = parsed.data

  try {
    const db = getDb()
    const [course] = await db
      .select({ id: courses.id, title: courses.title, instructorId: courses.instructorId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
    if (!course) return failure("Course not found.")
    if (sender.role !== "ADMIN" && course.instructorId !== sender.id) {
      return failure("You do not have permission to email this course.")
    }

    const now = new Date()
    const rows = await db
      .select({ email: users.email })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.studentId, users.id))
      .where(
        and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.status, "ACTIVE"),
          or(isNull(enrollments.expiresAt), gt(enrollments.expiresAt, now))
        )
      )

    const emails = [...new Set(rows.map((row) => row.email).filter(Boolean))]
    if (emails.length === 0) {
      return failure("There are no active students in this course.")
    }

    const html = emailLayout(
      subject,
      `<p style="font-size:14px;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</p>
       <p style="margin-top:16px;font-size:12px;color:#666">Sent by your instructor for ${escapeHtml(course.title)}.</p>`
    )

    const { alias, from } = senderIdentity(sender)

    let sent = 0
    for (const batch of chunkRecipients(emails)) {
      const result = await sendEmail({
        from,
        to: batch,
        subject,
        html,
        text: message,
        replyTo: alias,
      })
      if (result.ok) sent += batch.length
    }

    if (sent === 0) {
      return failure("The email could not be sent. Check the email configuration.")
    }
    return success(`Email sent to ${sent} student${sent === 1 ? "" : "s"}.`)
  } catch (error) {
    return toActionError(error)
  }
}
