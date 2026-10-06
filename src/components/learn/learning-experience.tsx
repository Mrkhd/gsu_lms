"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  Menu,
  PlayCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { formatDate, formatDuration } from "@/lib/format"
import { getVideoEmbed } from "@/lib/video"
import { markLessonViewedAction, toggleLessonCompleteAction } from "@/server/actions/progress"

export type LearningLesson = {
  id: string
  title: string
  type: string
  videoUrl: string | null
  content: string | null
  pdfUrl: string | null
  durationMinutes: number | null
  isPreview: boolean
  sectionId: string
  sectionTitle: string
  completed: boolean
}

export type LearningSection = {
  id: string
  title: string
  lessons: LearningLesson[]
}

export function LearningExperience({
  course,
  sections,
  currentLessonId,
  progress,
  completed,
  total,
  expiresAt,
  daysLeft,
}: {
  course: { id: string; slug: string; title: string }
  sections: LearningSection[]
  currentLessonId: string
  progress: number
  completed: number
  total: number
  expiresAt: string | null
  daysLeft: number | null
}) {
  const router = useRouter()
  const lessons = React.useMemo(
    () => sections.flatMap((section) => section.lessons),
    [sections]
  )
  const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId)
  const current = lessons[currentIndex] ?? lessons[0]
  const prev = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const next = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  React.useEffect(() => {
    if (current) void markLessonViewedAction(current.id)
  }, [current])

  const onToggleComplete = () => {
    if (!current) return
    const target = !current.completed
    void toggleLessonCompleteAction(current.id, target).then((result) => {
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      toast.success(target ? "Lesson completed" : "Marked as incomplete")
      router.refresh()
    })
  }

  const sidebar = (
    <LessonSidebar
      sections={sections}
      currentLessonId={currentLessonId}
      progress={progress}
      completed={completed}
      total={total}
      courseSlug={course.slug}
    />
  )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Course content">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Course content</SheetTitle>
              </SheetHeader>
              <div className="h-full overflow-y-auto">{sidebar}</div>
            </SheetContent>
          </Sheet>
          <Link
            href={`/courses/${course.slug}`}
            className="truncate font-heading text-sm font-semibold hover:underline sm:text-base"
          >
            {course.title}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {expiresAt ? (
              <Badge variant={daysLeft !== null && daysLeft <= 7 ? "destructive" : "secondary"}>
                {daysLeft !== null ? `${daysLeft} days left` : formatDate(expiresAt)}
              </Badge>
            ) : (
              <Badge variant="secondary">Lifetime access</Badge>
            )}
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {progress}% complete
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-0.5 rounded-none" />
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r lg:block">
          {sidebar}
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
            {current ? (
              <>
                <LessonBody lesson={current} />
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    disabled={!prev}
                    onClick={() => prev && router.push(`/learn/${course.slug}/${prev.id}`)}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <Button
                    variant={current.completed ? "secondary" : "default"}
                    onClick={onToggleComplete}
                  >
                    {current.completed ? <CircleCheck /> : <Check />}
                    {current.completed ? "Completed" : "Mark complete"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!next}
                    onClick={() => next && router.push(`/learn/${course.slug}/${next.id}`)}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">This course has no lessons yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function LessonSidebar({
  sections,
  currentLessonId,
  progress,
  completed,
  total,
  courseSlug,
}: {
  sections: LearningSection[]
  currentLessonId: string
  progress: number
  completed: number
  total: number
  courseSlug: string
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Course content</span>
          <span className="text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.lessons.map((lesson) => {
                const active = lesson.id === currentLessonId
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${courseSlug}/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {lesson.completed ? (
                        <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : lesson.type === "VIDEO" ? (
                        <PlayCircle className="size-4 shrink-0" />
                      ) : (
                        <FileText className="size-4 shrink-0" />
                      )}
                      <span className="line-clamp-2 flex-1">{lesson.title}</span>
                      {lesson.durationMinutes ? (
                        <span className="text-xs">{formatDuration(lesson.durationMinutes)}</span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function LessonBody({ lesson }: { lesson: LearningLesson }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Badge variant="outline">{lesson.type.toLowerCase()}</Badge>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{lesson.title}</h1>
      </div>

      {lesson.type === "VIDEO" ? <VideoPlayer url={lesson.videoUrl} title={lesson.title} /> : null}

      {lesson.type === "TEXT" ? (
        <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {lesson.content || "No content yet."}
        </div>
      ) : null}

      {lesson.type === "PDF" && lesson.pdfUrl ? (
        <div className="overflow-hidden rounded-xl border">
          <iframe src={lesson.pdfUrl} title={lesson.title} className="h-[70vh] w-full" />
        </div>
      ) : null}

      {lesson.type === "VIDEO" && lesson.content ? (
        <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {lesson.content}
        </div>
      ) : null}
    </div>
  )
}

function VideoPlayer({ url, title }: { url: string | null; title: string }) {
  const embed = getVideoEmbed(url)
  if (embed.kind === "none") {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        No video provided for this lesson.
      </div>
    )
  }
  if (embed.kind === "iframe") {
    return (
      <div className="overflow-hidden rounded-xl border">
        <iframe
          src={embed.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    )
  }
  return (
    <video src={embed.src} controls className="aspect-video w-full rounded-xl bg-black">
      <track kind="captions" />
    </video>
  )
}
