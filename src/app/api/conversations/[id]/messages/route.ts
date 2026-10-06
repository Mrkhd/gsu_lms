import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { conversations, messages } from "@/db/schema"
import {
  canAccessConversation,
  getConversationMessages,
  getConversationWithCourse,
  notifyConversationMessage,
} from "@/lib/chat"
import { getCurrentUser } from "@/lib/auth/server"
import { fullName } from "@/lib/format"

async function authorize(conversationId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: new Response("Unauthorized", { status: 401 }) }
  const loaded = await getConversationWithCourse(conversationId)
  if (!loaded) return { error: new Response("Not found", { status: 404 }) }
  const allowed = await canAccessConversation({ id: user.id, role: user.role }, loaded)
  if (!allowed) return { error: new Response("Forbidden", { status: 403 }) }
  return { user, loaded }
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const result = await authorize(id)
  if ("error" in result) return result.error

  const rows = await getConversationMessages(id)
  return Response.json({
    messages: rows.map((message) => ({
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName: fullName(message.sender?.profile, message.sender?.email ?? "User"),
      createdAt: message.createdAt,
    })),
  })
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const result = await authorize(id)
  if ("error" in result) return result.error
  const { user, loaded } = result

  let payload: { body?: unknown }
  try {
    payload = await request.json()
  } catch {
    return new Response("Invalid body", { status: 400 })
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : ""
  if (!body) return new Response("Message cannot be empty", { status: 400 })
  if (body.length > 4000) return new Response("Message is too long", { status: 400 })

  const db = getDb()
  const [message] = await db
    .insert(messages)
    .values({ conversationId: id, senderId: user.id, body })
    .returning()
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), updatedAt: new Date() })
    .where(eq(conversations.id, id))

  const senderName = fullName(
    { firstName: user.firstName, lastName: user.lastName },
    user.email
  )
  await notifyConversationMessage(loaded, user.id, senderName, body)

  return Response.json({
    message: {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      senderName,
      createdAt: message.createdAt,
    },
  })
}
