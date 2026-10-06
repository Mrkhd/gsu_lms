"use server"

import { mediaUrl, mediaKey, putObject } from "@/db/storage"
import { requireActionRole } from "@/lib/auth/server"
import { failure, success, toActionError, type ActionState } from "@/lib/action-utils"

export async function uploadMediaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState<{ url: string }>> {
  try {
    await requireActionRole("ADMIN", "INSTRUCTOR")
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return failure("Choose a file to upload.")
    }
    const prefix = String(formData.get("prefix") ?? "media").replace(/[^a-z0-9/_-]/gi, "")
    const key = mediaKey(prefix || "media", file.name)
    const body = await file.arrayBuffer()
    await putObject(key, body, { contentType: file.type || undefined })
    return success("File uploaded.", { url: mediaUrl(key) })
  } catch (error) {
    return toActionError(error)
  }
}
