import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import type { Role } from "@/db/types"
import { getDb } from "@/db/client"
import { profiles, users } from "@/db/schema"
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "./session"

export type CurrentUser = SessionUser & {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

/** Reads + verifies the session cookie. Does not touch the database. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Loads the authenticated user from the database (source of truth for role/status). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionUser()
  if (!session) return null

  const db = getDb()
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, session.id))
    .limit(1)

  if (!row || row.status === "SUSPENDED") return null

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.firstName ?? null,
    lastName: row.lastName ?? null,
    avatarUrl: row.avatarUrl ?? null,
  }
}

/** Page guard: redirects unauthenticated visitors to the login screen. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/** Page guard: ensures the user holds one of the allowed roles. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect("/dashboard")
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole("ADMIN")
}

export async function requireInstructor(): Promise<CurrentUser> {
  return requireRole("INSTRUCTOR", "ADMIN")
}

export async function requireStudent(): Promise<CurrentUser> {
  return requireUser()
}

/** Server-action guard: throws instead of redirecting. */
export async function requireActionUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error("You must be signed in to do that.")
  return user
}

/** Server-action guard for a specific set of roles. */
export async function requireActionRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireActionUser()
  if (!roles.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.")
  }
  return user
}

export function isAdmin(user: { role: Role } | null | undefined): boolean {
  return user?.role === "ADMIN"
}

export function canManageCourse(
  user: { id: string; role: Role } | null | undefined,
  course: { instructorId: string }
): boolean {
  if (!user) return false
  return user.role === "ADMIN" || course.instructorId === user.id
}
