import { BookOpen } from "lucide-react"

import { CatalogFilters } from "@/components/catalog-filters"
import { CourseCard } from "@/components/course-card"
import { EmptyState } from "@/components/empty-state"
import { PaginationControls } from "@/components/pagination-controls"
import { getCategories, getPublishedCourses, type CatalogSort } from "@/lib/queries"

const SORTS: CatalogSort[] = ["newest", "popular", "price-asc", "price-desc"]

export const metadata = { title: "Courses" }

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined)

  const search = get("q")
  const categorySlug = get("category")
  const sortParam = get("sort")
  const sort = SORTS.includes(sortParam as CatalogSort) ? (sortParam as CatalogSort) : "newest"
  const page = Math.max(1, Number(get("page") ?? "1") || 1)

  const [result, categories] = await Promise.all([
    getPublishedCourses({ search, categorySlug, sort, page }),
    getCategories(),
  ])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          {result.total} {result.total === 1 ? "course" : "courses"} available
        </p>
      </div>

      <CatalogFilters basePath="/courses" categories={categories} />

      {result.items.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <PaginationControls
            basePath="/courses"
            page={result.page}
            totalPages={result.totalPages}
            params={{ q: search, category: categorySlug, sort }}
          />
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try a different search term or category."
        />
      )}
    </div>
  )
}
