import Link from "next/link"
import { ArrowRight, BookOpen, PlayCircle, Trophy } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { StudentCourseCard } from "@/components/student-course-card"
import { Thumbnail } from "@/components/thumbnail"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/lib/auth/server"
import { getStudentCourses } from "@/lib/queries"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const user = await requireUser()
  const items = await getStudentCourses(user.id)

  const active = items.filter(
    (item) => item.enrollment.status === "ACTIVE" && !isExpiredDate(item.enrollment.expiresAt)
  )
  const inProgress = active.filter((item) => item.progress > 0 && item.progress < 100)
  const completed = active.filter((item) => item.total > 0 && item.progress === 100)
  const continueItem =
    inProgress[0] ?? active.find((item) => item.progress < 100) ?? active[0] ?? items[0] ?? null

  const firstName = user.firstName ?? "there"

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Pick up where you left off or explore something new."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">
              Browse courses
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Enrolled courses" value={active.length} />
        <StatCard icon={PlayCircle} label="In progress" value={inProgress.length} />
        <StatCard icon={Trophy} label="Completed" value={completed.length} />
        <StatCard
          icon={BookOpen}
          label="Average progress"
          value={`${
            active.length
              ? Math.round(active.reduce((sum, item) => sum + item.progress, 0) / active.length)
              : 0
          }%`}
        />
      </div>

      {continueItem ? (
        <section className="mt-8 space-y-3">
          <h2 className="font-heading text-lg font-semibold">Continue learning</h2>
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
              <Thumbnail
                src={continueItem.course.thumbnailUrl}
                alt={continueItem.course.title}
                seed={continueItem.course.slug}
                className="aspect-video w-full shrink-0 rounded-lg sm:w-56"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    {continueItem.course.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {continueItem.completed} of {continueItem.total} lessons completed
                  </p>
                </div>
                <Progress value={continueItem.progress} />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{continueItem.progress}% complete</span>
                  <Button asChild size="sm" className="ml-auto">
                    <Link href={`/learn/${continueItem.course.slug}`}>
                      Continue
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">My courses</h2>
          {items.length > 4 ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/my-courses">View all</Link>
            </Button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.slice(0, 4).map((item) => (
              <StudentCourseCard key={item.enrollment.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Browse the catalog and enroll in your first course."
            action={
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  )
}

function isExpiredDate(date: Date | null) {
  return date ? date.getTime() <= Date.now() : false
}
