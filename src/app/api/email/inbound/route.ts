import { createHmac, timingSafeEqual } from "node:crypto"

import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { inboundEmails, profiles, users } from "@/db/schema"
import { env } from "@/lib/env"

export const runtime = "nodejs"

type ReceivedEmail = {
  id: string
  from?: string
  to?: string[]
  subject?: string | null
  text?: string | null
  html?: string | null
  message_id?: string
  created_at?: string
}

function verifySvix(payload: string, headers: Headers): boolean {
  const secret = env.RESEND_WEBHOOK_SECRET
  if (!secret) return true // no secret configured yet; the email_id is still validated below
  const id = headers.get("svix-id")
  const timestamp = headers.get("svix-timestamp")
  const signature = headers.get("svix-signature")
  if (!id || !timestamp || !signature) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 5 * 60) return false

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64")

  return signature
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter((value): value is string => Boolean(value))
    .some((candidate) => {
      const a = Buffer.from(expected)
      const b = Buffer.from(candidate)
      return a.length === b.length && timingSafeEqual(a, b)
    })
}

async function resolveRecipient(toEmail: string) {
  const local = toEmail.split("@")[0].toLowerCase()
  const db = getDb()
  const rows = await db
    .select({ id: users.id, firstName: profiles.firstName })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.role, "INSTRUCTOR"))

  const match = rows.find((row) => {
    const slug = (row.firstName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
    return slug && slug === local
  })
  return match?.id ?? null
}

function parseFrom(raw: string) {
  const match = raw.match(/^(.*)<([^>]+)>\s*$/)
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, "") || null, email: match[2].trim() }
  }
  return { name: null, email: raw.trim() }
}

export async function POST(request: Request) {
  const payload = await request.text()
  if (!verifySvix(payload, request.headers)) {
    return new Response("Invalid signature", { status: 400 })
  }

  let event: { type?: string; data?: { email_id?: string } }
  try {
    event = JSON.parse(payload)
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  if (event.type !== "email.received") return Response.json({ ok: true })
  const emailId = event.data?.email_id
  if (!emailId || !env.RESEND_API_KEY) return Response.json({ ok: true })

  try {
    const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
    })
    if (!response.ok) {
      console.error("[email] could not fetch inbound email", response.status)
      return Response.json({ ok: false }, { status: 502 })
    }

    const email = (await response.json()) as ReceivedEmail
    const toEmail = email.to?.[0] ?? ""
    const from = parseFrom(email.from ?? "")
    const recipientUserId = toEmail ? await resolveRecipient(toEmail) : null

    const db = getDb()
    await db
      .insert(inboundEmails)
      .values({
        resendEmailId: emailId,
        recipientUserId,
        fromEmail: from.email || "unknown",
        fromName: from.name,
        toEmail,
        subject: email.subject ?? "(no subject)",
        textBody: email.text ?? null,
        htmlBody: email.html ?? null,
        messageId: email.message_id ?? null,
        receivedAt: email.created_at ? new Date(email.created_at) : new Date(),
      })
      .onConflictDoNothing({ target: inboundEmails.resendEmailId })

    return Response.json({ ok: true })
  } catch (error) {
    console.error("[email] inbound processing failed", error)
    return Response.json({ ok: false }, { status: 500 })
  }
}
