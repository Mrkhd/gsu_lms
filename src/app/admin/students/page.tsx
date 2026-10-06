import { GraduationCap, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { UserCreateDialog } from "@/components/admin/user-create-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { formatShortDate, fullName, initials } from "@/lib/format"
import { getStudents } from "@/lib/queries"
import { deleteUserAction, updateUserRoleAction, updateUserStatusAction } from "@/server/actions/users"

export const metadata = { title: "Students" }

export default async function StudentsPage() {
  const admin = await requireAdmin()
  const students = await getStudents()

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${students.length} students on the platform.`}
        actions={
          <UserCreateDialog
            role="STUDENT"
            label="New student"
            trigger={
              <Button size="sm">
                <Plus />
                New student
              </Button>
            }
          />
        }
      />

      {students.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
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
                    <StatusBadge status={student.status} />
                  </TableCell>
                  <TableCell>{student._count.enrollments}</TableCell>
                  <TableCell>{student._count.orders}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(student.createdAt)}
                  </TableCell>
                  <TableCell>
                    {student.id === admin.id ? (
                      <p className="text-right text-xs text-muted-foreground">You</p>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={updateUserRoleAction.bind(null, student.id, "INSTRUCTOR")}
                        >
                          Make instructor
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={updateUserStatusAction.bind(
                            null,
                            student.id,
                            student.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
                          )}
                        >
                          {student.status === "SUSPENDED" ? "Activate" : "Suspend"}
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          action={deleteUserAction.bind(null, student.id)}
                          confirm={{
                            title: "Delete this student?",
                            description: "All enrollments and orders will be removed.",
                            confirmLabel: "Delete",
                          }}
                        >
                          Delete
                        </ActionButton>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={GraduationCap} title="No students yet" />
      )}
    </div>
  )
}
