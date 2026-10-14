import { asc, eq } from "drizzle-orm"

import { getDb } from "./client"
import { bundles, courseCategories, courses, profiles, users } from "./schema"

export async function getCategoryOptions() {
  const db = getDb()
  return db
    .select({ id: courseCategories.id, name: courseCategories.name })
    .from(courseCategories)
    .orderBy(asc(courseCategories.name))
}

export async function getCourseOptions() {
  const db = getDb()
  return db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .orderBy(asc(courses.title))
}

export async function getBundleOptions() {
  const db = getDb()
  return db
    .select({ id: bundles.id, title: bundles.title })
    .from(bundles)
    .orderBy(asc(bundles.title))
}

export async function getInstructorOptions() {
  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.role, "INSTRUCTOR"))
    .orderBy(asc(users.createdAt))
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    profile: { firstName: row.firstName, lastName: row.lastName },
  }))
}
