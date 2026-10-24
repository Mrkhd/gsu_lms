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
import { sectionAvailability, weekNumberFromTitle } from "@/lib/weeks"

function LockedBlock({
  title,
  message,
  courseSlug,
  actionHref,
  actionLabel,
}: {
  title: string
  message: string
  courseSlug: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/courses/${courseSlug}`}>Back to course</Link>
            </Button>
            {actionHref ? (
              <Button asChild>
                <Link href={actionHref}>{actionLabel ?? "Continue"}</Link>
              </Button>
            ) : null}
          </div>
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
  const enrollmentStart = access.enrollment?.startedAt ?? new Date(now)
  const submittedIds = new Set(
    data.assignments.filter((assignment) => assignment.submitted).map((assignment) => assignment.id)
  )

  const weekAccess = (sectionTitle: string, sectionAvailableAt: Date | null) => {
    const week = weekNumberFromTitle(sectionTitle)
    if (!isStudent) {
      return {
        locked: false,
        reason: null as "time" | "assignment" | null,
        releaseAt: null,
        week,
      }
    }
    return sectionAvailability({
      week,
      sectionAvailableAt,
      enrollmentStart,
      now,
      allAssignments: data.assignments,
      submittedIds,
    })
  }

  const currentSection = data.course.sections.find(
    (section) => section.id === currentLesson.sectionId
  )
  const currentAccess = weekAccess(
    currentSection?.title ?? "",
    currentSection?.availableAt ?? null
  )
  const lessonRelease = currentLesson.availableAt ?? null
  const lessonLocked = isStudent && !!lessonRelease && lessonRelease.getTime() > now

  if (currentAccess.locked) {
    if (currentAccess.reason === "time" && currentAccess.releaseAt) {
      return (
        <LockedBlock
          title="Scheduled material"
          message={`“${currentSection?.title ?? currentLesson.title}” unlocks on ${formatDate(
            currentAccess.releaseAt,
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }
          )}.`}
          courseSlug={data.course.slug}
        />
      )
    }
    return (
      <LockedBlock
        title="Complete last week's assignment"
        message={`Submit the Week ${(currentAccess.week ?? 1) - 1} assignment(s) to unlock “${
          currentSection?.title ?? currentLesson.title
        }”.`}
        courseSlug={data.course.slug}
        actionHref={`/learn/${data.course.slug}/assignments`}
        actionLabel="Go to assignments"
      />
    )
  }

  if (lessonLocked && lessonRelease) {
    return (
      <LockedBlock
        title="Scheduled material"
        message={`“${currentLesson.title}” unlocks on ${formatDate(lessonRelease, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}.`}
        courseSlug={data.course.slug}
      />
    )
  }

  const sections: LearningSection[] = data.course.sections.map((section) => {
    const state = weekAccess(section.title, section.availableAt ?? null)
    const week = state.week
    const sectionAssignments =
      week === null
        ? []
        : data.assignments
            .filter((assignment) => weekNumberFromTitle(assignment.title) === week)
            .map((assignment) => ({
              id: assignment.id,
              title: assignment.title,
              submitted: assignment.submitted,
            }))

    return {
      id: section.id,
      title: section.title,
      availableAt: section.availableAt ? section.availableAt.toISOString() : null,
      locked: state.locked,
      lockReason: state.reason,
      releaseAt: state.releaseAt ? state.releaseAt.toISOString() : null,
      week,
      assignments: sectionAssignments,
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
          locked: state.locked || lessonLock,
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
