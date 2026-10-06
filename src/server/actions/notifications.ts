"use server"

import { revalidatePath } from "next/cache"

import { requireActionUser } from "@/lib/auth/server"
import { markNotificationsRead } from "@/lib/chat"
import { success, toActionError, type ActionState } from "@/lib/action-utils"

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  const user = await requireActionUser()
  try {
    await markNotificationsRead(user.id)
    revalidatePath("/notifications")
    return success("Notifications marked as read.")
  } catch (error) {
    return toActionError(error)
  }
}
