import Link from "next/link"
import type { PublishStatus } from "@/db/types"
import { Boxes, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { ExportButton } from "@/components/admin/export-button"
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
import { getAdminBundles } from "@/lib/queries"
import { deleteBundleAction, setBundleStatusAction } from "@/server/actions/bundles"

export const metadata = { title: "Bundles" }

export default async function AdminBundlesPage({
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
  const bundles = await getAdminBundles({ search, status })

  return (
    <div>
      <PageHeader
        title="Bundles"
        description="Group courses together and sell them as a package."
        actions={
          <div className="flex items-center gap-2">
            <ExportButton type="bundles" />
            <Button asChild size="sm">
              <Link href="/admin/bundles/new">
                <Plus />
                New bundle
              </Link>
            </Button>
          </div>
        }
      />

      <TableFilters
        basePath="/admin/bundles"
        searchPlaceholder="Search semesters"
        selects={[{ key: "status", placeholder: "All statuses", options: STATUS_OPTIONS }]}
      />

      {bundles.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bundle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="max-w-56 overflow-hidden">
                    <Link
                      href={`/admin/bundles/${bundle.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {bundle.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bundle.status} />
                  </TableCell>
                  <TableCell>{bundle._count.courses}</TableCell>
                  <TableCell>{bundle._count.enrollments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(bundle.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/bundles/${bundle.id}`}>Edit</Link>
                      </Button>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={setBundleStatusAction.bind(
                          null,
                          bundle.id,
                          bundle.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
                        )}
                      >
                        {bundle.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        action={deleteBundleAction.bind(null, bundle.id)}
                        confirm={{
                          title: "Delete this bundle?",
                          description: "The courses inside will not be deleted.",
                          confirmLabel: "Delete bundle",
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
          icon={Boxes}
          title="No bundles yet"
          description="Create a bundle to sell multiple courses together."
          action={
            <Button asChild>
              <Link href="/admin/bundles/new">Create bundle</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
