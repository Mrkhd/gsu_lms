"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  courseSections,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  orderItems,
  reviews,
} from "@/db/schema"
import type { PublishStatus } from "@/db/types"
import { requireActionRole } from "@/lib/auth/server"
import { courseSchema, lessonSchema, reorderSchema, sectionSchema } from "@/lib/validations"
import { uniqueCourseSlug } from "@/lib/slugs"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

async function getManageableCourse(courseId: string) {
  const user = await requireActionRole("ADMIN", "INSTRUCTOR")
  const db = getDb()
  const [course] = await db
    .select({
      id: courses.id,
      instructorId: courses.instructorId,
      slug: courses.slug,
      publishedAt: courses.publishedAt,
    })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1)
  if (!course) throw new Error("Course not found.")
  if (user.role !== "ADMIN" && course.instructorId !== user.id) {
    throw new Error("You do not have permission to manage this course.")
  }
  return course
}

function builderPath(role: string, courseId: string) {
  return role === "ADMIN" ? `/admin/courses/${courseId}` : `/instructor/courses/${courseId}`
}

function refreshCourse(courseId: string, slug: string) {
  revalidatePath("/admin/courses")
  revalidatePath("/instructor/courses")
  revalidatePath("/courses")
  revalidatePath(`/courses/${slug}`)
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath(`/instructor/courses/${courseId}`)
}

async function nextSectionPosition(courseId: string) {
  const db = getDb()
  const [row] = await db
    .select({ v: sql<number>`coalesce(max(${courseSections.position}), -1)` })
    .from(courseSections)
    .where(eq(courseSections.courseId, courseId))
  return Number(row?.v ?? -1) + 1
}

async function nextLessonPosition(sectionId: string) {
  const db = getDb()
  const [row] = await db
    .select({ v: sql<number>`coalesce(max(${lessons.position}), -1)` })
    .from(lessons)
    .where(eq(lessons.sectionId, sectionId))
  return Number(row?.v ?? -1) + 1
}

export async function createCourseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireActionRole("ADMIN", "INSTRUCTOR")
  const parsed = courseSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  let courseId = ""
  try {
    const db = getDb()
    const instructorId = user.role === "ADMIN" ? data.instructorId ?? user.id : user.id
    const slug = await uniqueCourseSlug(data.title, data.slug)
    const [course] = await db
      .insert(courses)
      .values({
        title: data.title,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        categoryId: data.categoryId || null,
        instructorId,
        level: data.level,
        price: data.price,
        accessDurationDays: data.accessDurationDays,
        status: data.status,
        whatYouLearn: data.whatYouLearn,
        requirements: data.requirements,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      })
      .returning()
    courseId = course.id
    refreshCourse(course.id, course.slug)
  } catch (error) {
    return toActionError(error)
  }
  redirect(builderPath(user.role, courseId))
}

export async function updateCourseAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const courseId = String(formData.get("courseId") ?? "")
  const course = await getManageableCourse(courseId)
  const user = await requireActionRole("ADMIN", "INSTRUCTOR")
  const parsed = courseSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  try {
    const db = getDb()
    const slug = await uniqueCourseSlug(data.title, data.slug, course.id)
    const [updated] = await db
      .update(courses)
      .set({
        title: data.title,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        categoryId: data.categoryId || null,
        instructorId: user.role === "ADMIN" ? data.instructorId ?? course.instructorId : course.instructorId,
        level: data.level,
        price: data.price,
        accessDurationDays: data.accessDurationDays,
        status: data.status,
        whatYouLearn: data.whatYouLearn,
        requirements: data.requirements,
        publishedAt:
          data.status === "PUBLISHED"
            ? new Date()
            : data.status === "DRAFT"
              ? null
              : course.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, course.id))
      .returning()
    refreshCourse(updated.id, updated.slug)
    return success("Course saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function setCourseStatusAction(
  courseId: string,
  status: PublishStatus
): Promise<ActionState> {
  try {
    const user = await requireActionRole("ADMIN", "INSTRUCTOR")
    const course = await getManageableCourse(courseId)
    if (user.role === "INSTRUCTOR" && status !== "PUBLISHED") {
      return failure("Instructors can publish a course but cannot unpublish or archive it.")
    }
    const db = getDb()
    const [updated] = await db
      .update(courses)
      .set({ status, publishedAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() })
      .where(eq(courses.id, course.id))
      .returning()
    refreshCourse(updated.id, updated.slug)
    return success(status === "PUBLISHED" ? "Course published." : "Course updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteCourseAction(courseId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const course = await getManageableCourse(courseId)
    const db = getDb()
    await db.update(orderItems).set({ courseId: null }).where(eq(orderItems.courseId, course.id))
    await db.delete(bundleCourses).where(eq(bundleCourses.courseId, course.id))
    await db.delete(lessonProgress).where(eq(lessonProgress.courseId, course.id))
    await db.delete(reviews).where(eq(reviews.courseId, course.id))
    await db.delete(enrollments).where(eq(enrollments.courseId, course.id))
    await db.delete(lessons).where(eq(lessons.courseId, course.id))
    await db.delete(courseSections).where(eq(courseSections.courseId, course.id))
    await db.delete(courses).where(eq(courses.id, course.id))
    revalidatePath("/admin/courses")
    revalidatePath("/instructor/courses")
    revalidatePath("/courses")
    return success("Course deleted.")
  } catch (error) {
    return toActionError(error)
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function createSectionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const courseId = String(formData.get("courseId") ?? "")
  try {
    const course = await getManageableCourse(courseId)
    const parsed = sectionSchema.safeParse(formDataToObject(formData))
    if (!parsed.success) return fromZodError(parsed.error)
    const db = getDb()
    const position = await nextSectionPosition(course.id)
    await db
      .insert(courseSections)
      .values({ courseId: course.id, title: parsed.data.title, position })
    refreshCourse(course.id, course.slug)
    return success("Section added.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateSectionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sectionId = String(formData.get("sectionId") ?? "")
  try {
    const db = getDb()
    const [section] = await db
      .select({ id: courseSections.id, courseId: courseSections.courseId })
      .from(courseSections)
      .where(eq(courseSections.id, sectionId))
      .limit(1)
    if (!section) return failure("Section not found.")
    const course = await getManageableCourse(section.courseId)
    const parsed = sectionSchema.safeParse(formDataToObject(formData))
    if (!parsed.success) return fromZodError(parsed.error)
    await db
      .update(courseSections)
      .set({ title: parsed.data.title, updatedAt: new Date() })
      .where(eq(courseSections.id, section.id))
    refreshCourse(course.id, course.slug)
    return success("Section renamed.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteSectionAction(sectionId: string): Promise<ActionState> {
  try {
    const db = getDb()
    const [section] = await db
      .select({ id: courseSections.id, courseId: courseSections.courseId })
      .from(courseSections)
      .where(eq(courseSections.id, sectionId))
      .limit(1)
    if (!section) return failure("Section not found.")
    const course = await getManageableCourse(section.courseId)
    await db.delete(lessons).where(eq(lessons.sectionId, section.id))
    await db.delete(courseSections).where(eq(courseSections.id, section.id))
    refreshCourse(course.id, course.slug)
    return success("Section deleted.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function reorderSectionsAction(
  courseId: string,
  orderedIds: string[]
): Promise<ActionState> {
  try {
    const course = await getManageableCourse(courseId)
    const parsed = reorderSchema.safeParse({ orderedIds })
    if (!parsed.success) return fromZodError(parsed.error)
    const db = getDb()
    for (let i = 0; i < parsed.data.orderedIds.length; i++) {
      await db
        .update(courseSections)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(courseSections.id, parsed.data.orderedIds[i]))
    }
    refreshCourse(course.id, course.slug)
    return success("Sections reordered.")
  } catch (error) {
    return toActionError(error)
  }
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export async function createLessonAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sectionId = String(formData.get("sectionId") ?? "")
  try {
    const db = getDb()
    const [section] = await db
      .select({ id: courseSections.id, courseId: courseSections.courseId })
      .from(courseSections)
      .where(eq(courseSections.id, sectionId))
      .limit(1)
    if (!section) return failure("Section not found.")
    const course = await getManageableCourse(section.courseId)
    const parsed = lessonSchema.safeParse(formDataToObject(formData))
    if (!parsed.success) return fromZodError(parsed.error)
    const data = parsed.data
    const position = await nextLessonPosition(section.id)
    await db.insert(lessons).values({
      courseId: course.id,
      sectionId: section.id,
      title: data.title,
      type: data.type,
      videoUrl: data.videoUrl || null,
      content: data.content || null,
      pdfUrl: data.pdfUrl || null,
      durationMinutes: data.durationMinutes,
      isPreview: data.isPreview,
      position,
    })
    refreshCourse(course.id, course.slug)
    return success("Lesson added.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateLessonAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const lessonId = String(formData.get("lessonId") ?? "")
  try {
    const db = getDb()
    const [lesson] = await db
      .select({ id: lessons.id, courseId: lessons.courseId })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1)
    if (!lesson) return failure("Lesson not found.")
    const course = await getManageableCourse(lesson.courseId)
    const parsed = lessonSchema.safeParse(formDataToObject(formData))
    if (!parsed.success) return fromZodError(parsed.error)
    const data = parsed.data
    await db
      .update(lessons)
      .set({
        title: data.title,
        type: data.type,
        videoUrl: data.videoUrl || null,
        content: data.content || null,
        pdfUrl: data.pdfUrl || null,
        durationMinutes: data.durationMinutes,
        isPreview: data.isPreview,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lesson.id))
    refreshCourse(course.id, course.slug)
    return success("Lesson saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteLessonAction(lessonId: string): Promise<ActionState> {
  try {
    const db = getDb()
    const [lesson] = await db
      .select({ id: lessons.id, courseId: lessons.courseId })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1)
    if (!lesson) return failure("Lesson not found.")
    const course = await getManageableCourse(lesson.courseId)
    await db.delete(lessonProgress).where(eq(lessonProgress.lessonId, lesson.id))
    await db.delete(lessons).where(eq(lessons.id, lesson.id))
    refreshCourse(course.id, course.slug)
    return success("Lesson deleted.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function reorderLessonsAction(
  sectionId: string,
  orderedIds: string[]
): Promise<ActionState> {
  try {
    const db = getDb()
    const [section] = await db
      .select({ id: courseSections.id, courseId: courseSections.courseId })
      .from(courseSections)
      .where(eq(courseSections.id, sectionId))
      .limit(1)
    if (!section) return failure("Section not found.")
    const course = await getManageableCourse(section.courseId)
    const parsed = reorderSchema.safeParse({ orderedIds })
    if (!parsed.success) return fromZodError(parsed.error)
    for (let i = 0; i < parsed.data.orderedIds.length; i++) {
      await db
        .update(lessons)
        .set({ position: i, updatedAt: new Date() })
        .where(eq(lessons.id, parsed.data.orderedIds[i]))
    }
    refreshCourse(course.id, course.slug)
    return success("Lessons reordered.")
  } catch (error) {
    return toActionError(error)
  }
}
