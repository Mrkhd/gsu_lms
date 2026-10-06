import { and, eq, ne } from "drizzle-orm"

import { getDb } from "@/db/client"
import { bundles, courseCategories, courses, programs } from "@/db/schema"
import { slugify } from "@/lib/format"

async function resolveUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  excludeId?: string
): Promise<string> {
  const root = base || "item"
  let slug = root
  let counter = 2
  for (let i = 0; i < 200; i++) {
    if (!(await isTaken(slug))) return slug
    void excludeId
    slug = `${root}-${counter++}`
  }
  return `${root}-${Date.now()}`
}

export function uniqueCourseSlug(title: string, provided?: string, excludeId?: string) {
  const db = getDb()
  return resolveUniqueSlug(
    slugify(provided || title),
    async (slug) => {
      const [row] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(
          excludeId
            ? and(eq(courses.slug, slug), ne(courses.id, excludeId))
            : eq(courses.slug, slug)
        )
        .limit(1)
      return Boolean(row)
    },
    excludeId
  )
}

export function uniqueBundleSlug(title: string, provided?: string, excludeId?: string) {
  const db = getDb()
  return resolveUniqueSlug(
    slugify(provided || title),
    async (slug) => {
      const [row] = await db
        .select({ id: bundles.id })
        .from(bundles)
        .where(
          excludeId
            ? and(eq(bundles.slug, slug), ne(bundles.id, excludeId))
            : eq(bundles.slug, slug)
        )
        .limit(1)
      return Boolean(row)
    },
    excludeId
  )
}

export function uniqueProgramSlug(title: string, provided?: string, excludeId?: string) {
  const db = getDb()
  return resolveUniqueSlug(
    slugify(provided || title),
    async (slug) => {
      const [row] = await db
        .select({ id: programs.id })
        .from(programs)
        .where(
          excludeId
            ? and(eq(programs.slug, slug), ne(programs.id, excludeId))
            : eq(programs.slug, slug)
        )
        .limit(1)
      return Boolean(row)
    },
    excludeId
  )
}

export function uniqueCategorySlug(name: string, provided?: string, excludeId?: string) {
  const db = getDb()
  return resolveUniqueSlug(
    slugify(provided || name),
    async (slug) => {
      const [row] = await db
        .select({ id: courseCategories.id })
        .from(courseCategories)
        .where(
          excludeId
            ? and(eq(courseCategories.slug, slug), ne(courseCategories.id, excludeId))
            : eq(courseCategories.slug, slug)
        )
        .limit(1)
      return Boolean(row)
    },
    excludeId
  )
}
