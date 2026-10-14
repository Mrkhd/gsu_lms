import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, CheckCircle2, Clock, GraduationCap, Layers, Star } from "lucide-react"

import { Curriculum } from "@/components/curriculum"
import { ReviewForm } from "@/components/review-form"
import { Thumbnail } from "@/components/thumbnail"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCourseAccess } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"
import { formatAccessDuration, formatDate, fullName, initials } from "@/lib/format"
import { getCourseBySlug } from "@/lib/queries"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)
  return { title: course?.title ?? "Course" }
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseBySlug(slug)

  if (!course || (course.status !== "PUBLISHED" && course.status !== "ARCHIVED")) {
    notFound()
  }

  const user = await getCurrentUser()
  const access = user ? await getCourseAccess(user.id, course.id) : null

  const rating =
    course.reviews.length > 0
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
      : null

  const canReview = !!access?.hasAccess
  const hasReviewed = !!user && course.reviews.some((review) => review.studentId === user.id)
  const totalMinutes = course.sections.reduce(
    (sum, section) =>
      sum + section.lessons.reduce((s, lesson) => s + (lesson.durationMinutes ?? 0), 0),
    0
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.category?.name ?? "Uncategorised"}</Badge>
              <Badge variant="outline">{course.level.toLowerCase()}</Badge>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground">{course.shortDescription}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                {fullName(course.instructor.profile, "Instructor")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-4" />
                {course._count.lessons} lessons
              </span>
              {rating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)} ({course._count.reviews})
                </span>
              ) : null}
            </div>
          </div>

          <Thumbnail
            src={course.thumbnailUrl}
            alt={course.title}
            seed={course.slug}
            className="aspect-video w-full rounded-xl ring-1 ring-foreground/10"
          />

          {course.whatYouLearn.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-heading text-xl font-semibold">What you&apos;ll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.whatYouLearn.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.description ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">About this course</h2>
              <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {course.description}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Course content</h2>
            <Curriculum
              sections={course.sections.map((section) => ({
                id: section.id,
                title: section.title,
                lessons: section.lessons.map((lesson) => ({
                  id: lesson.id,
                  title: lesson.title,
                  type: lesson.type,
                  durationMinutes: lesson.durationMinutes,
                  isPreview: lesson.isPreview,
                })),
              }))}
            />
          </section>

          {course.requirements.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">Requirements</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {course.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-4">
            <Separator />
            <h2 className="font-heading text-xl font-semibold">Instructor</h2>
            <div className="flex items-start gap-4">
              <Avatar className="size-12">
                <AvatarImage src={course.instructor.profile?.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>
                  {initials(
                    course.instructor.profile?.firstName,
                    course.instructor.profile?.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">
                  {fullName(course.instructor.profile, "Instructor")}
                </p>
                {course.instructor.profile?.headline ? (
                  <p className="text-sm text-muted-foreground">
                    {course.instructor.profile.headline}
                  </p>
                ) : null}
                {course.instructor.profile?.bio ? (
                  <p className="text-sm text-muted-foreground">{course.instructor.profile.bio}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">
              Reviews {rating ? `(${course._count.reviews})` : ""}
            </h2>
            {course.reviews.length > 0 ? (
              <ul className="space-y-4">
                {course.reviews.map((review) => (
                  <li key={review.id} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback>
                          {initials(
                            review.student.profile?.firstName,
                            review.student.profile?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {fullName(review.student.profile, "Student")}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-0.5">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
            {canReview ? (
              <ReviewForm courseId={course.id} existing={hasReviewed} />
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium">{formatAccessDuration(course.accessDurationDays)}</span>
              </div>

              {access?.hasAccess ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/learn/${course.slug}`}>Continue learning</Link>
                </Button>
              ) : !user ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`}>
                    Sign in
                  </Link>
                </Button>
              ) : access?.reason === "LOCKED" ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground">
                  This course is locked by an administrator for your account.
                </p>
              ) : (
                <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Access is assigned by Galmudug State University. Contact your program administrator
                  to be enrolled.
                </p>
              )}

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Layers className="size-4" />
                  {course._count.lessons} lessons
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="size-4" />
                  {course.sections.length} sections
                </li>
                {totalMinutes > 0 ? (
                  <li className="flex items-center gap-2">
                    <Clock className="size-4" />
                    {Math.round(totalMinutes / 60)}h of content
                  </li>
                ) : null}
              </ul>

              <p className="text-xs text-muted-foreground">
                Updated {formatDate(course.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}


