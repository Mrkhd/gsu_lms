import Link from "next/link"
import type { EnrollmentStatus } from "@/db/types"
import { TicketCheck, UserPlus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { ExportButton } from "@/components/admin/export-button"
import { ENROLLMENT_STATUS_OPTIONS, TableFilters } from "@/components/admin/table-filters"
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
import { requireAdmin } from "@/lib/auth/server"
import { formatDate, fullName } from "@/lib/format"
import {
  getAdminSemesterEnrollments,
  getProgramsWithSemesters,
  getStudents,
} from "@/lib/queries"
import { revokeSemesterEnrollmentAction } from "@/server/actions/enrollments"

export const metadata = { title: "Enrollments" }

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const status =
    typeof params.status === "string" &&
    ["ACTIVE", "EXPIRED", "CANCELLED"].includes(params.status)
      ? (params.status as EnrollmentStatus)
      : undefined
  const [enrollments, students, programs] = await Promise.all([
    getAdminSemesterEnrollments({ search, status }),
    getStudents(),
    getProgramsWithSemesters(),
  ])

  const studentOptions = students.map((student) => ({
    id: student.id,
    name: `${fullName(student.profile, student.email)} · ${student.email}`,
  }))

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="Semester assignments are the source of truth for course access."
        actions={
          <div className="flex items-center gap-2">
            <ExportButton type="enrollments" />
            <EnrollmentGrantDialog
              students={studentOptions}
              programs={programs}
              trigger={
                <Button size="sm">
                  <UserPlus />
                  Assign to program
                </Button>
              }
            />
          </div>
        }
      />

      <TableFilters
        basePath="/admin/enrollments"
        searchPlaceholder="Search students"
        selects={[
          { key: "status", placeholder: "All statuses", options: ENROLLMENT_STATUS_OPTIONS },
        ]}
      />

      {enrollments.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Semester</TableHead>
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
                  <TableCell className="max-w-56 truncate">
                    <Link href={`/bundles/${enrollment.bundle.slug}`} className="hover:underline">
                      {enrollment.bundle.title}
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
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/students/${enrollment.studentId}`}>Manage</Link>
                      </Button>
                      <EnrollmentEditDialog
                        studentId={enrollment.studentId}
                        bundleId={enrollment.bundleId}
                        status={enrollment.status}
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
                        action={revokeSemesterEnrollmentAction.bind(
                          null,
                          enrollment.studentId,
                          enrollment.bundleId
                        )}
                        confirm={{
                          title: "Revoke this semester?",
                          description:
                            "The student will lose access to every course in the semester immediately.",
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
        <EmptyState icon={TicketCheck} title="No semester enrollments yet" />
      )}
    </div>
  )
}
