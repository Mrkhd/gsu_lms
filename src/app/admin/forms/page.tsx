import Link from "next/link"
import type { PublishStatus } from "@/db/types"
import { ClipboardList, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { STATUS_OPTIONS, TableFilters } from "@/components/admin/table-filters"
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
import { formatShortDate } from "@/lib/format"
import { getAdminForms } from "@/lib/queries"
import { deleteFormAction, setFormStatusAction } from "@/server/actions/forms"

export const metadata = { title: "Forms" }

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const status =
    typeof params.status === "string" &&
    ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(params.status)
      ? (params.status as PublishStatus)
      : undefined
  const forms = await getAdminForms({ search, status })

  return (
    <div>
      <PageHeader
        title="Forms"
        description="Build forms and collect responses. Students can submit without signing in."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/forms/new">
              <Plus />
              New form
            </Link>
          </Button>
        }
      />

      <TableFilters
        basePath="/admin/forms"
        searchPlaceholder="Search forms"
        selects={[{ key: "status", placeholder: "All statuses", options: STATUS_OPTIONS }]}
      />

      {forms.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="max-w-56 overflow-hidden">
                    <Link
                      href={`/admin/forms/${form.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {form.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">/{form.slug}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={form.status} />
                  </TableCell>
                  <TableCell>{form._count.fields}</TableCell>
                  <TableCell>{form._count.responses}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(form.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {form.status === "PUBLISHED" ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/forms/${form.slug}`} target="_blank">
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/forms/${form.id}`}>Edit</Link>
                      </Button>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={setFormStatusAction.bind(
                          null,
                          form.id,
                          form.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED"
                        )}
                      >
                        {form.status === "PUBLISHED" ? "Close" : "Publish"}
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        action={deleteFormAction.bind(null, form.id)}
                        confirm={{
                          title: "Delete this form?",
                          description: "All of its responses will be permanently removed.",
                          confirmLabel: "Delete form",
                        }}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No forms yet"
          description="Create a form to start collecting responses."
          action={
            <Button asChild>
              <Link href="/admin/forms/new">Create form</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
