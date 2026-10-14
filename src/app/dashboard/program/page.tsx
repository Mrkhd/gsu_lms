import Link from "next/link"
import { Clock, ExternalLink, School } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requireUser } from "@/lib/auth/server"
import { formatDate } from "@/lib/format"
import { getStudentPrograms } from "@/lib/queries"

export const metadata = { title: "My program" }

export default async function StudentProgramPage() {
  const user = await requireUser()
  const programs = await getStudentPrograms(user.id)

  return (
    <div>
      <PageHeader
        title="My program"
        description="Your degree progress."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/programs">
              Browse programs
              <ExternalLink />
            </Link>
          </Button>
        }
      />

      {programs.length > 0 ? (
        <div className="space-y-8">
          {programs.map((item) => (
            <Card key={item.enrollment.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>{item.program.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {item.program.code ? `${item.program.code} · ` : ""}
                      {item.program.level} · {item.program.semesterCount} semesters
                    </p>
                  </div>
                  <Badge variant="default">Current semester {item.enrollment.currentSemester}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Semesters assigned</span>
                    <span className="font-medium">
                      {item.paidSemesters}/{item.totalSemesters}
                    </span>
                  </div>
                  <Progress value={item.progress} />
                </div>

                <div className="space-y-3">
                  {item.semesters.map((semester) => {
                    const firstCourse = semester.bundle.courses[0]?.course
                    return (
                      <div
                        key={semester.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Semester {semester.number}
                          </span>
                          <p className="font-medium">{semester.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {semester.bundle._count.courses} courses
                            {semester.owned && semester.bundleEnrollment?.expiresAt
                              ? ` · access until ${formatDate(semester.bundleEnrollment.expiresAt)}`
                              : semester.owned
                                ? " · lifetime access"
                                : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          {semester.owned ? (
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={firstCourse ? `/learn/${firstCourse.slug}` : "/dashboard/my-courses"}
                              >
                                Continue
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Assigned by the university
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Each semester packages its courses for one term of access.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={School}
          title="You are not enrolled in a program"
          description="Browse our degree programs to get started."
          action={
            <Button asChild>
              <Link href="/programs">Browse programs</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
