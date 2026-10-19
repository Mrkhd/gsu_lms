import { env } from "@/lib/env"

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  from?: string
}

/** Per-instructor sending address, e.g. amira@postgrad.galmudugsu.edu.so */
export function instructorAddress(user: { firstName: string | null; email: string }) {
  const fromName = (user.firstName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const fromEmail = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
  return `${fromName || fromEmail || "instructor"}@${env.EMAIL_DOMAIN}`
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function emailLayout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${bodyHtml}
      <p style="margin-top:24px;font-size:12px;color:#666">GSU Postgraduate</p>
    </div>
  </body>
</html>`
}

function appLink(path?: string) {
  if (!path) return env.NEXT_PUBLIC_APP_URL
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

/** Sends an email through Resend. Never throws; logs failures. */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set; skipping email.")
    return { ok: false, error: "Email is not configured." }
  }

  const to = Array.isArray(input.to) ? input.to.filter(Boolean) : [input.to].filter(Boolean)
  if (to.length === 0) return { ok: false, error: "No recipients." }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from ?? env.EMAIL_FROM,
        to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("[email] Resend rejected the request", response.status, detail.slice(0, 500))
      return { ok: false, error: "Email provider rejected the request." }
    }
    return { ok: true }
  } catch (error) {
    console.error("[email] send failed", error)
    return { ok: false, error: "Could not send email." }
  }
}

/** Email mirror of an in-app notification (best-effort). */
export async function sendNotificationEmail(
  to: string,
  notification: { title: string; body?: string | null; url?: string | null }
) {
  const link = appLink(notification.url ?? undefined)
  const html = emailLayout(
    notification.title,
    `<p style="font-size:14px;line-height:1.5">${escapeHtml(notification.body ?? "")}</p>
     <p style="margin-top:16px"><a href="${link}" style="display:inline-block;background:#7f1d1d;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px">Open GSU Postgraduate</a></p>`
  )
  return sendEmail({
    to,
    subject: notification.title,
    html,
    text: notification.body ?? undefined,
  })
}

/** Splits recipients into Resend-safe batches (max 50 per request). */
export function chunkRecipients(emails: string[], size = 50) {
  const chunks: string[][] = []
  for (let i = 0; i < emails.length; i += size) chunks.push(emails.slice(i, i + size))
  return chunks
}
