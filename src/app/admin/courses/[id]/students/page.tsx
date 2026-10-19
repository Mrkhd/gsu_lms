import Link from "next/link"
import { notFound } from "next/navigation"
import type { EnrollmentStatus } from "@/db/types"
import { ArrowLeft, Users } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { ENROLLMENT_STATUS_OPTIONS, TableFilters } from "@/components/admin/table-filters"
import { PageHeader } from "@/components/dashboard-shell"
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
import { requireAdmin } from "@/lib/auth/server"
import { formatDate, fullName, initials } from "@/lib/format"
import { getCourseStudents } from "@/lib/queries"
import { resetCourseProgressAction } from "@/server/actions/progress"

export const metadata = { title: "Course students" }

export default async function AdminCourseStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
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
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1)
  if (!course) notFound()

  const students = await getCourseStudents(course.id, { search, status })

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href={`/admin/courses/${course.id}`}>
          <ArrowLeft />
          Back to course
        </Link>
      </Button>
      <PageHeader
        title="Enrolled students"
        description={`${students.length} students in ${course.title}`}
      />

      <TableFilters
        basePath={`/admin/courses/${course.id}/students`}
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
                <TableHead>Enrolled</TableHead>
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
                        <p className="font-medium">
                          {fullName(student.profile, student.email)}
                        </p>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(enrollment.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        action={resetCourseProgressAction.bind(
                          null,
                          enrollment.studentId,
                          course.id
                        )}
                        confirm={{
                          title: "Reset this student's progress?",
                          description:
                            "All completed and viewed lessons for this course will be cleared.",
                          confirmLabel: "Reset progress",
                        }}
                      >
                        Reset progress
                      </ActionButton>
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
