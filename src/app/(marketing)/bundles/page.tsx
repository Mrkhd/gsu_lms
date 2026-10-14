import { Boxes } from "lucide-react"

import { BundleCard } from "@/components/bundle-card"
import { CatalogFilters } from "@/components/catalog-filters"
import { EmptyState } from "@/components/empty-state"
import { PaginationControls } from "@/components/pagination-controls"
import { getProgramOptions, getPublishedBundles } from "@/lib/queries"

export const metadata = { title: "Semesters" }

export default async function SemestersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined)
  const search = get("q")
  const programSlug = get("program")
  const page = Math.max(1, Number(get("page") ?? "1") || 1)

  const [result, programs] = await Promise.all([
    getPublishedBundles({ search, programSlug, page }),
    getProgramOptions(),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Semesters</h1>
        <p className="text-muted-foreground">
          {result.total} {result.total === 1 ? "semester" : "semesters"} available · each named by
          its program
        </p>
      </div>

      <CatalogFilters basePath="/bundles" categories={[]} programs={programs} showSort={false} />

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
            params={{ q: search, program: programSlug }}
          />
        </>
      ) : (
        <EmptyState
          icon={Boxes}
          title="No semesters yet"
          description="Semester packages will appear here once they are published."
        />
      )}
    </div>
  )
}
