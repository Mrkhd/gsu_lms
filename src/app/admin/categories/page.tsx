import { FolderTree, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { TableFilters } from "@/components/admin/table-filters"
import { CategoryDialog } from "@/components/admin/category-dialog"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
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
import { getCategories } from "@/lib/queries"
import { deleteCategoryAction } from "@/server/actions/categories"

export const metadata = { title: "Categories" }

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const categories = await getCategories({ search })

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise your catalog into topics."
        actions={
          <CategoryDialog
            trigger={
              <Button size="sm">
                <Plus />
                New category
              </Button>
            }
          />
        }
      />

      <TableFilters basePath="/admin/categories" searchPlaceholder="Search categories" />

      {categories.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>{category._count.courses}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <CategoryDialog
                        category={{
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description,
                        }}
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
                        action={deleteCategoryAction.bind(null, category.id)}
                        confirm={{
                          title: "Delete this category?",
                          description: "Courses will be left uncategorised.",
                          confirmLabel: "Delete",
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
        <EmptyState icon={FolderTree} title="No categories yet" description="Add your first category." />
      )}
    </div>
  )
}
