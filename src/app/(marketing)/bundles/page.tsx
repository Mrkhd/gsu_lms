import { Boxes } from "lucide-react"

import { BundleCard } from "@/components/bundle-card"
import { CatalogFilters } from "@/components/catalog-filters"
import { EmptyState } from "@/components/empty-state"
import { PaginationControls } from "@/components/pagination-controls"
import { getPublishedBundles } from "@/lib/queries"

export const metadata = { title: "Bundles" }

export default async function BundlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined)
  const search = get("q")
  const page = Math.max(1, Number(get("page") ?? "1") || 1)

  const result = await getPublishedBundles({ search, page })

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Bundles</h1>
        <p className="text-muted-foreground">
          {result.total} {result.total === 1 ? "bundle" : "bundles"} available
        </p>
      </div>

      <CatalogFilters basePath="/bundles" categories={[]} showSort={false} />

      {result.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} />
            ))}
          </div>
          <PaginationControls
            basePath="/bundles"
            page={result.page}
            totalPages={result.totalPages}
            params={{ q: search }}
          />
        </>
      ) : (
        <EmptyState
          icon={Boxes}
          title="No bundles yet"
          description="Bundles will appear here once they are published."
        />
      )}
    </div>
  )
}
