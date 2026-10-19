import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { requireInstructor } from "@/lib/auth/server"
import { formatDate } from "@/lib/format"
import { getInstructorInboundEmail, markInboundEmailRead } from "@/lib/queries"

function stripHtml(html: string | null) {
  if (!html) return ""
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

export default async function InboundEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireInstructor()
  const { id } = await params
  const email = await getInstructorInboundEmail(user.id, id)
  if (!email) notFound()

  if (!email.readAt) {
    await markInboundEmailRead(user.id, id)
  }

  const body = email.textBody?.trim() || stripHtml(email.htmlBody) || "(No content)"

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/instructor/inbox">
          <ArrowLeft />
          Back to inbox
        </Link>
      </Button>

      <PageHeader
        title={email.subject ?? "(no subject)"}
        description={`${email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail} → ${email.toEmail}`}
      />

      <div className="rounded-xl border bg-background p-4 text-sm leading-relaxed whitespace-pre-line">
        {body}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Received {formatDate(email.receivedAt)}
      </p>
    </div>
  )
}
