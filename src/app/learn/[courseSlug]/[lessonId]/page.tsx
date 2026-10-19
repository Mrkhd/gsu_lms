import Link from "next/link"
import { notFound } from "next/navigation"
import { Lock } from "lucide-react"

import { AccessBlocked } from "@/components/learn/access-blocked"
import { LearningExperience, type LearningSection } from "@/components/learn/learning-experience"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCourseAccess } from "@/lib/access"
import { requireUser } from "@/lib/auth/server"
import { formatDate } from "@/lib/format"
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

  const currentLesson = data.lessons.find((lesson) => lesson.id === lessonId)
  if (!currentLesson) notFound()

  const scheduled =
    currentLesson.availableAt &&
    currentLesson.availableAt.getTime() > Date.now() &&
    user.role === "STUDENT"

  if (scheduled && currentLesson.availableAt) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-20">
        <Card>
          <CardHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </div>
            <CardTitle>Scheduled material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              &ldquo;{currentLesson.title}&rdquo; unlocks on{" "}
              {formatDate(currentLesson.availableAt, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              .
            </p>
            <Button asChild variant="outline">
              <Link href={`/courses/${data.course.slug}`}>Back to course</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
      availableAt: lesson.availableAt ? lesson.availableAt.toISOString() : null,
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
