import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, CheckCircle2, Clock, Layers, School } from "lucide-react"

import { Thumbnail } from "@/components/thumbnail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { and, eq, inArray } from "drizzle-orm"

import { getDb } from "@/db/client"
import { bundleEnrollments } from "@/db/schema"
import { getProgramAccess, isEnrollmentActive } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"
import { formatAccessDuration } from "@/lib/format"
import { getProgramBySlug } from "@/lib/queries"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const program = await getProgramBySlug(slug)
  return { title: program?.title ?? "Program" }
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const program = await getProgramBySlug(slug)

  if (!program || (program.status !== "PUBLISHED" && program.status !== "ARCHIVED")) {
    notFound()
  }

  const user = await getCurrentUser()
  const programAccess = user ? await getProgramAccess(user.id, program.id) : null

  const bundleIds = program.semesters.map((semester) => semester.bundleId)
  const db = getDb()
  const owned = user && bundleIds.length
    ? await db
        .select({
          bundleId: bundleEnrollments.bundleId,
          status: bundleEnrollments.status,
          expiresAt: bundleEnrollments.expiresAt,
        })
        .from(bundleEnrollments)
        .where(
          and(
            eq(bundleEnrollments.studentId, user.id),
            inArray(bundleEnrollments.bundleId, bundleIds)
          )
        )
    : []
  const ownedMap = new Map(owned.map((item) => [item.bundleId, item]))

  const totalCourses = program.semesters.reduce(
    (sum, semester) => sum + semester.bundle._count.courses,
    0
  )
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {program.code ? <Badge variant="secondary">{program.code}</Badge> : null}
              <Badge variant="outline">{program.level}</Badge>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {program.title}
            </h1>
            {program.shortDescription ? (
              <p className="text-lg text-muted-foreground">{program.shortDescription}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <School className="size-4" />
                {program.semesterCount} semesters
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="size-4" />
                {totalCourses} courses
              </span>
            </div>
          </div>

          <Thumbnail
            src={program.thumbnailUrl}
            alt={program.title}
            seed={program.slug}
            className="aspect-video w-full rounded-xl ring-1 ring-foreground/10"
          />

          {program.description ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">About this program</h2>
              <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {program.description}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-xl font-semibold">Curriculum by semester</h2>
                <p className="text-sm text-muted-foreground">
                  Courses are grouped into semesters.
                </p>
              </div>
              {programAccess?.enrolled ? (
                <Badge variant="default">
                  Enrolled · Semester {programAccess.currentSemester}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-4">
              {program.semesters.map((semester) => {
                const bundleEnrollment = ownedMap.get(semester.bundleId) ?? null
                const isOwned = isEnrollmentActive(bundleEnrollment)
                const firstCourse = semester.bundle.courses[0]?.course
                return (
                  <Card key={semester.id}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              Semester {semester.number}
                            </span>
                          </div>
                          <p className="font-heading text-lg font-semibold">{semester.title}</p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3.5" />
                            {formatAccessDuration(
                              semester.bundle.accessDurationDays ??
                                program.accessDurationDays
                            )}
                            {" · "}
                            {semester.bundle._count.courses} courses
                          </p>
                        </div>
                      </div>

                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {semester.bundle.courses.map(({ course }) => (
                          <li key={course.id} className="flex items-center gap-2 text-sm">
                            <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{course.title}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {course._count.lessons}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex justify-end">
                        {!user ? (
                          <Button asChild variant="outline">
                            <Link href={`/login?next=${encodeURIComponent(`/programs/${slug}`)}`}>
                              Sign in
                            </Link>
                          </Button>
                        ) : isOwned ? (
                          <Button asChild variant="outline">
                            <Link href={firstCourse ? `/learn/${firstCourse.slug}` : "/dashboard/program"}>
                              Continue learning
                            </Link>
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Access is assigned by the university.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                {formatAccessDuration(program.accessDurationDays)} per semester
              </div>

              {programAccess?.enrolled && user ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard/program">Go to my program</Link>
                </Button>
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <School className="mt-0.5 size-4 shrink-0" />
                    Access to each semester is assigned by Galmudug State University. Contact your
                    program administrator to be enrolled.
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                    Each semester unlocks its courses for one term.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
