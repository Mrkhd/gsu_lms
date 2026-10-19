import Link from "next/link"
import { Inbox, Mail } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { requireInstructor } from "@/lib/auth/server"
import { formatDate } from "@/lib/format"
import { getInstructorInbox } from "@/lib/queries"

export const metadata = { title: "Inbox" }

export default async function InstructorInboxPage() {
  const user = await requireInstructor()
  const emails = await getInstructorInbox(user.id)
  const unread = emails.filter((email) => !email.readAt).length

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={
          emails.length === 0
            ? "Replies to emails you send to students appear here."
            : `${emails.length} ${emails.length === 1 ? "reply" : "replies"}${unread > 0 ? ` · ${unread} unread` : ""}`
        }
      />

      {emails.length > 0 ? (
        <div className="divide-y overflow-hidden rounded-xl border bg-background">
          {emails.map((email) => (
            <Link
              key={email.id}
              href={`/instructor/inbox/${email.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${email.readAt ? "" : "font-semibold"}`}>
                  {email.subject ?? "(no subject)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {email.fromName ?? email.fromEmail} → {email.toEmail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!email.readAt ? <Badge variant="default">New</Badge> : null}
                <span className="text-xs text-muted-foreground">
                  {formatDate(email.receivedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title="No replies yet"
          description="When students reply to emails you send, they will show up here."
        />
      )}
    </div>
  )
}
