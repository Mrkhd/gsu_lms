"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses, reviews } from "@/db/schema"
import { getCourseAccess } from "@/lib/access"
import { requireActionUser } from "@/lib/auth/server"
import { reviewSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

export async function submitReviewAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireActionUser()
  const parsed = reviewSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { courseId, rating, comment } = parsed.data
  try {
    const db = getDb()
    const [course] = await db
      .select({ id: courses.id, slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)
    if (!course) return failure("Course not found.")

    const access = await getCourseAccess(user.id, course.id)
    if (!access.hasAccess) return failure("Only enrolled students can review this course.")

    const values = { studentId: user.id, courseId: course.id, rating, comment: comment || null }
    await db
      .insert(reviews)
      .values(values)
      .onConflictDoUpdate({
        target: [reviews.studentId, reviews.courseId],
        set: { rating, comment: comment || null, updatedAt: new Date() },
      })
    revalidatePath(`/courses/${course.slug}`)
    return success("Thanks for your review!")
  } catch (error) {
    return toActionError(error)
  }
}
