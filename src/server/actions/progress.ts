"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses, lessonProgress, lessons } from "@/db/schema"
import { getCourseAccess } from "@/lib/access"
import { requireActionUser } from "@/lib/auth/server"
import { success, toActionError, type ActionState } from "@/lib/action-utils"

async function assertLessonAccess(lessonId: string, studentId: string) {
  const db = getDb()
  const [lesson] = await db
    .select({ id: lessons.id, courseId: lessons.courseId, courseSlug: courses.slug })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(lessons.id, lessonId))
    .limit(1)
  if (!lesson) throw new Error("Lesson not found.")
  const access = await getCourseAccess(studentId, lesson.courseId)
  if (!access.hasAccess) {
    throw new Error("Your access to this course has expired. Renew to continue learning.")
  }
  return lesson
}

function refreshLearning(courseSlug: string) {
  revalidatePath(`/learn/${courseSlug}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/my-courses")
  revalidatePath("/dashboard/program")
}

export async function toggleLessonCompleteAction(
  lessonId: string,
  completed: boolean
): Promise<ActionState> {
  const user = await requireActionUser()
  try {
    const lesson = await assertLessonAccess(lessonId, user.id)
    const db = getDb()
    await db
      .insert(lessonProgress)
      .values({
        studentId: user.id,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.studentId, lessonProgress.lessonId],
        set: {
          completed,
          completedAt: completed ? new Date() : null,
          lastViewedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    refreshLearning(lesson.courseSlug)
    return success(completed ? "Lesson completed." : "Lesson marked as incomplete.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function markLessonViewedAction(lessonId: string): Promise<ActionState> {
  const user = await requireActionUser()
  try {
    const lesson = await assertLessonAccess(lessonId, user.id)
    const db = getDb()
    await db
      .insert(lessonProgress)
      .values({
        studentId: user.id,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        completed: false,
      })
      .onConflictDoUpdate({
        target: [lessonProgress.studentId, lessonProgress.lessonId],
        set: { lastViewedAt: new Date(), updatedAt: new Date() },
      })
    return success("Progress saved.")
  } catch (error) {
    return toActionError(error)
  }
}
