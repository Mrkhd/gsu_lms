import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, MessageSquare } from "lucide-react"

import { ChatPanel } from "@/components/chat/chat-panel"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDb } from "@/db/client"
import { courses } from "@/db/schema"
import { canManageCourse, requireInstructor } from "@/lib/auth/server"
import {
  getOrCreateDirectConversation,
  getOrCreateGroupConversation,
  markNotificationsRead,
} from "@/lib/chat"
import { fullName, initials } from "@/lib/format"
import { getCourseStudents } from "@/lib/queries"

export const metadata = { title: "Course chat" }

export default async function InstructorCourseChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ student?: string }>
}) {
  const user = await requireInstructor()
  const { id } = await params
  const { student: selectedStudentId } = await searchParams

  const db = getDb()
  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      instructorId: courses.instructorId,
    })
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1)
  if (!course) notFound()
  if (!canManageCourse(user, course)) notFound()

  const group = await getOrCreateGroupConversation(course.id)
  const students = await getCourseStudents(course.id)
  const selected = selectedStudentId
    ? students.find((entry) => entry.student.id === selectedStudentId)
    : undefined
  const direct = selected
    ? await getOrCreateDirectConversation(course.id, selected.student.id, course.instructorId)
    : null
  await markNotificationsRead(user.id, `/instructor/courses/${course.id}/chat`)

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/instructor/courses/${course.id}`}>
          <ArrowLeft />
          Back to course
        </Link>
      </Button>
      <PageHeader title="Course chat" description={course.title} />

      <Tabs defaultValue="group" className="space-y-4">
        <TabsList>
          <TabsTrigger value="group">Course chat</TabsTrigger>
          <TabsTrigger value="direct">Direct messages</TabsTrigger>
        </TabsList>

        <TabsContent value="group">
          <ChatPanel
            conversationId={group.id}
            currentUserId={user.id}
            placeholder="No messages yet. Post an announcement or answer student questions."
          />
        </TabsContent>

        <TabsContent value="direct">
          {students.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No students enrolled yet" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
              <div className="space-y-1 rounded-xl border p-2">
                {students.map((entry) => {
                  const name = fullName(entry.student.profile, entry.student.email)
                  const active = entry.student.id === selectedStudentId
                  return (
                    <Button
                      key={entry.student.id}
                      asChild
                      variant={active ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                    >
                      <Link
                        href={`/instructor/courses/${course.id}/chat?student=${entry.student.id}`}
                      >
                        <Avatar className="size-6">
                          <AvatarFallback>
                            {initials(entry.student.profile?.firstName, entry.student.profile?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{name}</span>
                      </Link>
                    </Button>
                  )
                })}
              </div>
              <div>
                {direct ? (
                  <ChatPanel conversationId={direct.id} currentUserId={user.id} />
                ) : (
                  <div className="flex h-[60vh] items-center justify-center rounded-xl border text-sm text-muted-foreground">
                    Select a student to start a private conversation.
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
