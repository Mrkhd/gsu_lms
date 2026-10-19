import Link from "next/link"
import { notFound } from "next/navigation"
import type { EnrollmentStatus } from "@/db/types"
import { ArrowLeft, Mail, Users } from "lucide-react"

import { ENROLLMENT_STATUS_OPTIONS, TableFilters } from "@/components/admin/table-filters"
import { PageHeader } from "@/components/dashboard-shell"
import { EmailStudentDialog } from "@/components/instructor/email-student-dialog"
import { EmailStudentsDialog } from "@/components/instructor/email-students-dialog"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses } from "@/db/schema"
import { canManageCourse, requireInstructor } from "@/lib/auth/server"
import { formatDate, fullName, initials } from "@/lib/format"
import { getCourseStudents } from "@/lib/queries"

export const metadata = { title: "Course students" }

export default async function InstructorCourseStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireInstructor()
  const { id } = await params
  const query = await searchParams
  const search = typeof query.q === "string" ? query.q : undefined
  const status =
    typeof query.status === "string" &&
    ["ACTIVE", "EXPIRED", "CANCELLED"].includes(query.status)
      ? (query.status as EnrollmentStatus)
      : undefined

  const db = getDb()
  const [course] = await db
    .select({ id: courses.id, title: courses.title, instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1)
  if (!course) notFound()
  if (!canManageCourse(user, course)) notFound()

  const students = await getCourseStudents(course.id, { search, status })

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href={`/instructor/courses/${course.id}`}>
          <ArrowLeft />
          Back to course
        </Link>
      </Button>
      <PageHeader
        title="Enrolled students"
        description={`${students.length} students in ${course.title}`}
        actions={
          <EmailStudentsDialog
            courseId={course.id}
            trigger={
              <Button size="sm" variant="outline">
                <Mail />
                Email students
              </Button>
            }
          />
        }
      />

      <TableFilters
        basePath={`/instructor/courses/${course.id}/students`}
        searchPlaceholder="Search students"
        selects={[
          { key: "status", placeholder: "All statuses", options: ENROLLMENT_STATUS_OPTIONS },
        ]}
      />

      {students.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Access expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(({ enrollment, student, progress, completed, total }) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback>
                          {initials(student.profile?.firstName, student.profile?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{fullName(student.profile, student.email)}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enrollment.status} />
                  </TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-20" />
                      <span className="text-xs text-muted-foreground">
                        {completed}/{total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {enrollment.expiresAt ? formatDate(enrollment.expiresAt) : "Lifetime"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EmailStudentDialog
                        courseId={course.id}
                        studentId={enrollment.studentId}
                        studentName={fullName(student.profile, student.email)}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <Mail />
                            Email
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={Users} title="No students yet" description="Enrollments will show up here." />
      )}
    </div>
  )
}
