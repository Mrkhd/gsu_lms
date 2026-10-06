import { School } from "lucide-react"

import { ProgramCard } from "@/components/program-card"
import { CatalogFilters } from "@/components/catalog-filters"
import { EmptyState } from "@/components/empty-state"
import { PaginationControls } from "@/components/pagination-controls"
import { getPublishedPrograms } from "@/lib/queries"

export const metadata = { title: "Programs" }

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1)

  const result = await getPublishedPrograms({ search, page })

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Degree programs</h1>
        <p className="text-muted-foreground">
          {result.total} {result.total === 1 ? "program" : "programs"} · pay per semester
        </p>
      </div>

      <CatalogFilters basePath="/programs" categories={[]} showSort={false} />

      {result.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
          <PaginationControls
            basePath="/programs"
            page={result.page}
            totalPages={result.totalPages}
            params={{ q: search }}
          />
        </>
      ) : (
        <EmptyState
          icon={School}
          title="No programs published yet"
          description="Programs will appear here once they are published."
        />
      )}
    </div>
  )
}
