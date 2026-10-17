"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { profiles, users } from "@/db/schema"
import type { Role } from "@/db/types"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session"
import { requireActionUser } from "@/lib/auth/server"
import {
  changePasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function roleHome(role: Role): string {
  if (role === "ADMIN") return "/admin"
  if (role === "INSTRUCTOR") return "/instructor"
  return "/dashboard"
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { firstName, lastName, email, password } = parsed.data

  let role: Role = "STUDENT"
  try {
    const db = getDb()
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (existing) {
      return failure("An account with that email already exists.", {
        email: ["Email already registered"],
      })
    }
    const passwordHash = await hashPassword(password)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, role: "STUDENT" })
      .returning()
    await db.insert(profiles).values({ userId: user.id, firstName, lastName })
    role = user.role
    const token = await createSessionToken({ id: user.id, email: user.email, role: user.role })
    const store = await cookies()
    store.set(SESSION_COOKIE, token, sessionCookieOptions())
  } catch (error) {
    return toActionError(error)
  }
  redirect(roleHome(role))
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { email, password } = parsed.data

  let role: Role = "STUDENT"
  try {
    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) return failure("Invalid email or password.")
    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return failure("Invalid email or password.")
    if (user.status === "SUSPENDED") {
      return failure("This account has been suspended. Contact support for help.")
    }
    role = user.role
    const token = await createSessionToken({ id: user.id, email: user.email, role: user.role })
    const store = await cookies()
    store.set(SESSION_COOKIE, token, sessionCookieOptions())
  } catch (error) {
    return toActionError(error)
  }
  redirect(roleHome(role))
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/")
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sessionUser = await requireActionUser()
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { currentPassword, newPassword } = parsed.data

  try {
    const db = getDb()
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1)
    if (!user) return failure("Account not found.")

    const valid = await verifyPassword(currentPassword, user.passwordHash)
    if (!valid) {
      return failure("Your current password is incorrect.", {
        currentPassword: ["Incorrect password"],
      })
    }

    const passwordHash = await hashPassword(newPassword)
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    return success("Your password has been changed.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireActionUser()
  const parsed = profileSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { firstName, lastName, headline, bio, avatarUrl } = parsed.data

  try {
    const db = getDb()
    const values = {
      userId: user.id,
      firstName: firstName || null,
      lastName: lastName || null,
      headline: headline || null,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    }
    await db
      .insert(profiles)
      .values(values)
      .onConflictDoUpdate({ target: profiles.userId, set: { ...values, updatedAt: new Date() } })
  } catch (error) {
    return toActionError(error)
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")
  return success("Profile updated.")
}
