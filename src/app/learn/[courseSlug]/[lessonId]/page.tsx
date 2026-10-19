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

function ScheduledBlock({
  label,
  releaseAt,
  courseSlug,
}: {
  label: string
  releaseAt: Date
  courseSlug: string
}) {
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
            &ldquo;{label}&rdquo; unlocks on{" "}
            {formatDate(releaseAt, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            .
          </p>
          <Button asChild variant="outline">
            <Link href={`/courses/${courseSlug}`}>Back to course</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

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

  const now = data.now
  const isStudent = user.role === "STUDENT"
  const currentSection = data.course.sections.find(
    (section) => section.id === currentLesson.sectionId
  )

  const sectionRelease = currentSection?.availableAt ?? null
  const lessonRelease = currentLesson.availableAt ?? null
  const sectionLocked = isStudent && !!sectionRelease && sectionRelease.getTime() > now
  const lessonLocked = isStudent && !!lessonRelease && lessonRelease.getTime() > now

  // A section release gates every lesson inside it; a lesson release gates itself.
  if (sectionLocked && sectionRelease && currentSection) {
    return (
      <ScheduledBlock
        label={currentSection.title}
        releaseAt={sectionRelease}
        courseSlug={data.course.slug}
      />
    )
  }
  if (lessonLocked && lessonRelease) {
    return (
      <ScheduledBlock
        label={currentLesson.title}
        releaseAt={lessonRelease}
        courseSlug={data.course.slug}
      />
    )
  }

  const sections: LearningSection[] = data.course.sections.map((section) => {
    const sectionLock =
      isStudent && !!section.availableAt && section.availableAt.getTime() > now
    return {
      id: section.id,
      title: section.title,
      availableAt: section.availableAt ? section.availableAt.toISOString() : null,
      locked: sectionLock,
      lessons: section.lessons.map((lesson) => {
        const lessonLock =
          isStudent && !!lesson.availableAt && lesson.availableAt.getTime() > now
        return {
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          videoUrl: lesson.videoUrl,
          content: lesson.content,
          pdfUrl: lesson.pdfUrl,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview,
          availableAt: lesson.availableAt ? lesson.availableAt.toISOString() : null,
          locked: sectionLock || lessonLock,
          sectionId: section.id,
          sectionTitle: section.title,
          completed: lesson.progress[0]?.completed ?? false,
        }
      }),
    }
  })

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
