import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, School } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { CourseLockList } from "@/components/admin/course-lock-list"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth/server"
import { formatDate, fullName, initials } from "@/lib/format"
import { getStudentAccessDetail } from "@/lib/queries"

export const metadata = { title: "Student access" }

export default async function StudentAccessPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const detail = await getStudentAccessDetail(id)
  if (!detail) notFound()

  const { student, programs, semesters, lockedOnly } = detail

  return (
    <div>
      <PageHeader
        title={fullName(student.profile, student.email)}
        description="Assign semesters and lock individual courses for this student."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/students">
              <ArrowLeft />
              All students
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border bg-background p-4">
        <Avatar className="size-11">
          <AvatarFallback>{initials(student.profile?.firstName, student.profile?.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium">{fullName(student.profile, student.email)}</p>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={student.status} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/enrollments`}>Enrollments</Link>
          </Button>
        </div>
      </div>

      {programs.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {programs.map((program) => (
            <Badge key={program.title} variant="secondary">
              <School className="size-3" />
              {program.title} · Semester {program.currentSemester}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold">Semesters</h2>
          <p className="text-sm text-muted-foreground">
            Locking a course denies it to this student even while the semester is active.
          </p>
        </div>

        {semesters.length > 0 ? (
          semesters.map((semester) => (
            <Card key={semester.enrollment.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{semester.bundle.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {semester.enrollment.expiresAt
                        ? `Access until ${formatDate(semester.enrollment.expiresAt)}`
                        : "Lifetime access"}
                    </p>
                  </div>
                  <StatusBadge status={semester.enrollment.status} />
                </div>
              </CardHeader>
              <CardContent>
                <CourseLockList studentId={student.id} courses={semester.courses} />
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            This student has no semester enrollments yet. Assign one from the Enrollments page.
          </p>
        )}

        {lockedOnly.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Other locked courses</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseLockList studentId={student.id} courses={lockedOnly} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
