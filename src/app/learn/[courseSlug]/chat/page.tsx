import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ChatPanel } from "@/components/chat/chat-panel"
import { AccessBlocked } from "@/components/learn/access-blocked"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCourseAccess } from "@/lib/access"
import { requireUser } from "@/lib/auth/server"
import {
  getOrCreateDirectConversation,
  getOrCreateGroupConversation,
  markNotificationsRead,
} from "@/lib/chat"
import { getLearningCourse } from "@/lib/queries"

export const metadata = { title: "Messages" }

export default async function CourseChatPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const user = await requireUser()
  const data = await getLearningCourse(user.id, courseSlug)
  if (!data) notFound()

  const access = await getCourseAccess(user.id, data.course.id)
  if (!access.hasAccess) {
    return (
      <AccessBlocked
        course={{ slug: data.course.slug, title: data.course.title }}
        reason={access.reason === "ACTIVE" ? "NONE" : access.reason}
        expiresAt={access.enrollment?.expiresAt ?? null}
      />
    )
  }

  const group = await getOrCreateGroupConversation(data.course.id)
  const direct = await getOrCreateDirectConversation(
    data.course.id,
    user.id,
    data.course.instructorId
  )
  await markNotificationsRead(user.id, `/learn/${courseSlug}/chat`)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/learn/${courseSlug}`}>
          <ArrowLeft />
          Back to course
        </Link>
      </Button>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Messages</h1>
        <p className="text-sm text-muted-foreground">{data.course.title}</p>
      </div>

      <Tabs defaultValue="group" className="space-y-4">
        <TabsList>
          <TabsTrigger value="group">Course chat</TabsTrigger>
          <TabsTrigger value="direct">Instructor</TabsTrigger>
        </TabsList>
        <TabsContent value="group">
          <ChatPanel
            conversationId={group.id}
            currentUserId={user.id}
            placeholder="No messages yet. Start the course conversation."
          />
        </TabsContent>
        <TabsContent value="direct">
          <ChatPanel
            conversationId={direct.id}
            currentUserId={user.id}
            placeholder="Ask your instructor a question — only the two of you can see this."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
