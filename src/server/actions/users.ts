"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { profiles, users } from "@/db/schema"
import type { Role, UserStatus } from "@/db/types"
import { requireActionRole } from "@/lib/auth/server"
import { hashPassword } from "@/lib/auth/password"
import { createUserSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function refreshUsers() {
  revalidatePath("/admin/students")
  revalidatePath("/admin/instructors")
  revalidatePath("/admin")
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = createUserSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { firstName, lastName, email, password, role } = parsed.data
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
    const [user] = await db.insert(users).values({ email, passwordHash, role }).returning()
    await db.insert(profiles).values({ userId: user.id, firstName, lastName })
    refreshUsers()
    return success("User created.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateUserRoleAction(userId: string, role: Role): Promise<ActionState> {
  const admin = await requireActionRole("ADMIN")
  if (admin.id === userId) return failure("You cannot change your own role.")
  try {
    const db = getDb()
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId))
    refreshUsers()
    return success("Role updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateUserStatusAction(
  userId: string,
  status: UserStatus
): Promise<ActionState> {
  const admin = await requireActionRole("ADMIN")
  if (admin.id === userId) return failure("You cannot change your own status.")
  try {
    const db = getDb()
    await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId))
    refreshUsers()
    return success(status === "SUSPENDED" ? "User suspended." : "User activated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteUserAction(userId: string): Promise<ActionState> {
  const admin = await requireActionRole("ADMIN")
  if (admin.id === userId) return failure("You cannot delete your own account.")
  try {
    const db = getDb()
    await db.delete(users).where(eq(users.id, userId))
    refreshUsers()
    return success("User deleted.")
  } catch (error) {
    return toActionError(error)
  }
}
