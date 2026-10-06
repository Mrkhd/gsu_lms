import Link from "next/link"
import { BookOpen, CircleCheck, Users } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireInstructor } from "@/lib/auth/server"
import { formatShortDate } from "@/lib/format"
import { getInstructorCourses, getInstructorStats } from "@/lib/queries"

export const metadata = { title: "Instructor" }

export default async function InstructorDashboardPage() {
  const user = await requireInstructor()
  const [stats, courses] = await Promise.all([
    getInstructorStats(user.id),
    getInstructorCourses(user.id, user.role === "ADMIN"),
  ])

  return (
    <div>
      <PageHeader
        title="Instructor dashboard"
        description="Your teaching at a glance."
        actions={
          <Button asChild size="sm">
            <Link href="/instructor/courses">My courses</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={BookOpen} label="Courses" value={stats.courses} />
        <StatCard icon={CircleCheck} label="Published" value={stats.published} />
        <StatCard icon={Users} label="Students" value={stats.enrollments} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {courses.slice(0, 6).map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/instructor/courses/${course.id}`}
                  className="font-medium hover:underline"
                >
                  {course.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {course._count.lessons} lessons · {course._count.enrollments} students · updated{" "}
                  {formatShortDate(course.updatedAt)}
                </p>
              </div>
              <StatusBadge status={course.status} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/instructor/courses/${course.id}`}>Manage</Link>
              </Button>
            </div>
          ))}
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no courses yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
