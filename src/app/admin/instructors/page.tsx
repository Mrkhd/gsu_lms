import { Plus, Users } from "lucide-react"

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
import { getInstructors } from "@/lib/queries"
import { deleteUserAction, updateUserRoleAction, updateUserStatusAction } from "@/server/actions/users"

export const metadata = { title: "Instructors" }

export default async function InstructorsPage() {
  const admin = await requireAdmin()
  const instructors = await getInstructors()

  return (
    <div>
      <PageHeader
        title="Instructors"
        description={`${instructors.length} instructors.`}
        actions={
          <UserCreateDialog
            role="INSTRUCTOR"
            label="New instructor"
            trigger={
              <Button size="sm">
                <Plus />
                New instructor
              </Button>
            }
          />
        }
      />

      {instructors.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback>
                          {initials(instructor.profile?.firstName, instructor.profile?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {fullName(instructor.profile, instructor.email)}
                        </p>
                        <p className="text-xs text-muted-foreground">{instructor.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={instructor.status} />
                  </TableCell>
                  <TableCell>{instructor._count.instructorCourses}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(instructor.createdAt)}
                  </TableCell>
                  <TableCell>
                    {instructor.id === admin.id ? (
                      <p className="text-right text-xs text-muted-foreground">You</p>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={updateUserRoleAction.bind(null, instructor.id, "STUDENT")}
                        >
                          Make student
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={updateUserStatusAction.bind(
                            null,
                            instructor.id,
                            instructor.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
                          )}
                        >
                          {instructor.status === "SUSPENDED" ? "Activate" : "Suspend"}
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          action={deleteUserAction.bind(null, instructor.id)}
                          confirm={{
                            title: "Delete this instructor?",
                            description: "Their courses must be reassigned first.",
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
        <EmptyState icon={Users} title="No instructors yet" />
      )}
    </div>
  )
}
