import { notFound } from "next/navigation"

import { AccessBlocked } from "@/components/learn/access-blocked"
import { LearningExperience, type LearningSection } from "@/components/learn/learning-experience"
import { getCourseAccess } from "@/lib/access"
import { requireUser } from "@/lib/auth/server"
import { getLearningCourse } from "@/lib/queries"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  return { title: `Learning · ${courseSlug}` }
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>
}) {
  const { courseSlug, lessonId } = await params
  const user = await requireUser()
  const data = await getLearningCourse(user.id, courseSlug)

  if (!data) notFound()

  const access = await getCourseAccess(user.id, data.course.id)
  if (!access.hasAccess) {
    return (
      <AccessBlocked
        course={{ slug: data.course.slug, title: data.course.title }}
        reason={access.reason === "ACTIVE" ? "NONE" : access.reason}
        expiresAt={access.enrollment?.expiresAt ?? null}
      />
    )
  }

  const lessonExists = data.lessons.some((lesson) => lesson.id === lessonId)
  if (!lessonExists) notFound()

  const sections: LearningSection[] = data.course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: section.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      pdfUrl: lesson.pdfUrl,
      durationMinutes: lesson.durationMinutes,
      isPreview: lesson.isPreview,
      sectionId: section.id,
      sectionTitle: section.title,
      completed: lesson.progress[0]?.completed ?? false,
    })),
  }))

  return (
    <LearningExperience
      course={{ id: data.course.id, slug: data.course.slug, title: data.course.title }}
      sections={sections}
      currentLessonId={lessonId}
      progress={data.progress}
      completed={data.completed}
      total={data.total}
      expiresAt={access.enrollment?.expiresAt ? access.enrollment.expiresAt.toISOString() : null}
      daysLeft={access.daysLeft}
    />
  )
}
