import Link from "next/link"
import { Plus, School } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
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
import { formatPrice, formatShortDate, toNumber } from "@/lib/format"
import { getAdminPrograms } from "@/lib/queries"
import { deleteProgramAction, setProgramStatusAction } from "@/server/actions/programs"

export const metadata = { title: "Programs" }

export default async function AdminProgramsPage() {
  await requireAdmin()
  const programs = await getAdminPrograms()

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Degree programs made of semesters. Students pay per semester."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/programs/new">
              <Plus />
              New program
            </Link>
          </Button>
        }
      />

      {programs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Semesters</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Total tuition</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => {
                const total = program.semesters.reduce(
                  (sum, semester) => sum + toNumber(semester.bundle.price),
                  0
                )
                return (
                  <TableRow key={program.id}>
                    <TableCell className="max-w-56">
                      <Link
                        href={`/admin/programs/${program.id}`}
                        className="font-medium hover:underline"
                      >
                        {program.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {program.code ?? program.level}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={program.status} />
                    </TableCell>
                    <TableCell>
                      {program._count.semesters}/{program.semesterCount}
                    </TableCell>
                    <TableCell>{program._count.enrollments}</TableCell>
                    <TableCell>{formatPrice(total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatShortDate(program.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/programs/${program.id}`}>Edit</Link>
                        </Button>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={setProgramStatusAction.bind(
                            null,
                            program.id,
                            program.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
                          )}
                        >
                          {program.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          action={deleteProgramAction.bind(null, program.id)}
                          confirm={{
                            title: "Delete this program?",
                            description:
                              "Semester packages and courses are kept; only the program is removed.",
                            confirmLabel: "Delete program",
                          }}
                        >
                          Delete
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={School}
          title="No programs yet"
          description="Create your first degree program and map its semesters."
          action={
            <Button asChild>
              <Link href="/admin/programs/new">Create program</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
