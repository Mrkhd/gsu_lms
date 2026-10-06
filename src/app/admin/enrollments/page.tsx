import Link from "next/link"
import { TicketCheck, UserPlus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { EnrollmentEditDialog } from "@/components/admin/enrollment-edit-dialog"
import { EnrollmentGrantDialog } from "@/components/admin/enrollment-grant-dialog"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBundleOptions, getCourseOptions } from "@/db/options"
import { requireAdmin } from "@/lib/auth/server"
import { formatDate, fullName } from "@/lib/format"
import { getAdminEnrollments, getStudents } from "@/lib/queries"
import { revokeEnrollmentAction } from "@/server/actions/enrollments"

export const metadata = { title: "Enrollments" }

export default async function EnrollmentsPage() {
  await requireAdmin()
  const [enrollments, students, courses, bundles] = await Promise.all([
    getAdminEnrollments(),
    getStudents(),
    getCourseOptions(),
    getBundleOptions(),
  ])

  const studentOptions = students.map((student) => ({
    id: student.id,
    name: `${fullName(student.profile, student.email)} · ${student.email}`,
  }))

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="The source of truth for course access."
        actions={
          <EnrollmentGrantDialog
            students={studentOptions}
            courses={courses}
            bundles={bundles}
            trigger={
              <Button size="sm">
                <UserPlus />
                Grant access
              </Button>
            }
          />
        }
      />

      {enrollments.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="max-w-40 truncate">
                    {fullName(enrollment.student.profile, enrollment.student.email)}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">
                    <Link
                      href={`/courses/${enrollment.course.slug}`}
                      className="hover:underline"
                    >
                      {enrollment.course.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enrollment.source} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enrollment.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(enrollment.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {enrollment.expiresAt ? formatDate(enrollment.expiresAt) : "Lifetime"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <EnrollmentEditDialog
                        enrollment={{ id: enrollment.id, status: enrollment.status }}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        }
                      />
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        action={revokeEnrollmentAction.bind(null, enrollment.id)}
                        confirm={{
                          title: "Revoke this enrollment?",
                          description: "The student will lose access immediately.",
                          confirmLabel: "Revoke",
                        }}
                      >
                        Revoke
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={TicketCheck} title="No enrollments yet" />
      )}
    </div>
  )
}
