import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  conversations,
  courses,
  enrollments,
  messages,
  notifications,
  users,
} from "@/db/schema"
import type { ConversationType, Role } from "@/db/types"
import { getCourseAccess } from "@/lib/access"
import { sendNotificationEmail } from "@/lib/email"

export type ChatUser = { id: string; role: Role }

export async function getOrCreateGroupConversation(courseId: string) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.courseId, courseId), eq(conversations.type, "GROUP")))
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(conversations)
    .values({ courseId, type: "GROUP" })
    .returning()
  return created
}

export async function getOrCreateDirectConversation(
  courseId: string,
  studentId: string,
  instructorId: string
) {
  const db = getDb()
  const [existing] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.courseId, courseId),
        eq(conversations.type, "DIRECT"),
        eq(conversations.studentId, studentId)
      )
    )
    .limit(1)
  if (existing) return existing
  const [created] = await db
    .insert(conversations)
    .values({ courseId, type: "DIRECT", studentId, instructorId })
    .returning()
  return created
}

export type LoadedConversation = {
  conversation: typeof conversations.$inferSelect
  course: { id: string; slug: string; title: string; instructorId: string }
}

export async function getConversationWithCourse(
  conversationId: string
): Promise<LoadedConversation | null> {
  const db = getDb()
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1)
  if (!conversation) return null
  const [course] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      instructorId: courses.instructorId,
    })
    .from(courses)
    .where(eq(courses.id, conversation.courseId))
    .limit(1)
  if (!course) return null
  return { conversation, course }
}

export async function canAccessConversation(
  user: ChatUser,
  loaded: LoadedConversation
): Promise<boolean> {
  const { conversation, course } = loaded
  if (user.role === "ADMIN") return true
  const isCourseInstructor = course.instructorId === user.id
  if (conversation.type === "DIRECT") {
    return conversation.studentId === user.id || isCourseInstructor
  }
  if (isCourseInstructor) return true
  const access = await getCourseAccess(user.id, course.id)
  return access.hasAccess
}

async function getRecipientIds(loaded: LoadedConversation): Promise<string[]> {
  const { conversation, course } = loaded
  if (conversation.type === "DIRECT") {
    return [conversation.studentId, conversation.instructorId].filter(
      (id): id is string => Boolean(id)
    )
  }
  const db = getDb()
  const now = new Date()
  const rows = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, course.id),
        eq(enrollments.status, "ACTIVE"),
        or(isNull(enrollments.expiresAt), gt(enrollments.expiresAt, now))
      )
    )
  return [course.instructorId, ...rows.map((row) => row.studentId)]
}

function chatUrlFor(loaded: LoadedConversation, recipientId: string, type: ConversationType) {
  const { conversation, course } = loaded
  if (recipientId === course.instructorId) {
    return type === "DIRECT"
      ? `/instructor/courses/${course.id}/chat?student=${conversation.studentId}`
      : `/instructor/courses/${course.id}/chat`
  }
  return `/learn/${course.slug}/chat`
}

/** Creates notifications for the other conversation participants. */
export async function notifyConversationMessage(
  loaded: LoadedConversation,
  senderId: string,
  senderName: string,
  preview: string
) {
  const recipientIds = (await getRecipientIds(loaded)).filter((id) => id !== senderId)
  if (recipientIds.length === 0) return
  const db = getDb()
  const title = `New message from ${senderName}`
  const body = preview.slice(0, 140)

  await db.insert(notifications).values(
    recipientIds.map((userId) => ({
      userId,
      title,
      body,
      url: chatUrlFor(loaded, userId, loaded.conversation.type),
    }))
  )

  // Email mirror of the notification (best-effort).
  const recipients = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.id, recipientIds))
  await Promise.allSettled(
    recipients.map((recipient) =>
      sendNotificationEmail(recipient.email, {
        title,
        body,
        url: chatUrlFor(loaded, recipient.id, loaded.conversation.type),
      })
    )
  )
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const db = getDb()
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
  return rows.length
}

export async function getNotifications(userId: string, limit = 30) {
  const db = getDb()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
}

export async function markNotificationsRead(userId: string, url?: string) {
  const db = getDb()
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      url
        ? and(eq(notifications.userId, userId), eq(notifications.url, url), eq(notifications.read, false))
        : and(eq(notifications.userId, userId), eq(notifications.read, false))
    )
}

export async function getConversationMessages(conversationId: string, limit = 200) {
  const db = getDb()
  return db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    with: { sender: { with: { profile: true } } },
    orderBy: (m, { asc }) => [asc(m.createdAt)],
    limit,
  })
}
