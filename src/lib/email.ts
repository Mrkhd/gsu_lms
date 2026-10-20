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
  const logoUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/logo.png`
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111">
    <div style="max-width:560px;margin:0 auto">
      <div style="text-align:center;padding-bottom:16px">
        <img src="${logoUrl}" alt="GSU Postgraduate" width="64" height="64" style="display:inline-block;width:64px;height:64px;border:0;outline:none;text-decoration:none;border-radius:8px" />
      </div>
      <div style="background:#ffffff;border-radius:8px;padding:24px">
        <h1 style="font-size:18px;margin:0 0 16px">${escapeHtml(title)}</h1>
        ${bodyHtml}
        <p style="margin-top:24px;font-size:12px;color:#666">GSU Postgraduate</p>
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#999">Galmudug State University · Postgraduate LMS</p>
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

/** Welcome email sent when an admin creates a student or instructor account. */
export async function sendWelcomeEmail(params: {
  to: string
  name: string
  password: string
  replyTo?: string
}) {
  const { to, name, password, replyTo } = params
  const appUrl = env.NEXT_PUBLIC_APP_URL
  const subject = "Welcome to the Galmudug State University Postgraduate LMS"

  const text = `Dear ${name},

Welcome to Galmudug State University! We are pleased to inform you that your account on our Postgraduate Learning Management System (LMS) is now ready.

You can access the platform here:
${appUrl}

Your login details:
Email: ${to}
Password: ${password}

For your security, please log in as soon as possible and change your password after your first login. Do not share your login details with anyone.

On the platform you will be able to access your course materials, assignments, announcements, and communicate with your lecturers.

If you have trouble logging in or have any questions, please reply to this email and we will be happy to help.

We wish you a successful and rewarding academic journey.

Best regards,
Khalid Nur
Postgraduate admissions
Galmudug State University`

  const html = emailLayout(
    subject,
    `<p>Dear ${escapeHtml(name)},</p>
     <p>Welcome to Galmudug State University! We are pleased to inform you that your account on our Postgraduate Learning Management System (LMS) is now ready.</p>
     <p>You can access the platform here:<br /><a href="${appUrl}">${appUrl}</a></p>
     <p><strong>Your login details:</strong><br />Email: ${escapeHtml(to)}<br />Password: ${escapeHtml(password)}</p>
     <p>For your security, please log in as soon as possible and change your password after your first login. Do not share your login details with anyone.</p>
     <p>On the platform you will be able to access your course materials, assignments, announcements, and communicate with your lecturers.</p>
     <p>If you have trouble logging in or have any questions, please reply to this email and we will be happy to help.</p>
     <p>We wish you a successful and rewarding academic journey.</p>
     <p>Best regards,<br />Khalid Nur<br />Postgraduate admissions<br />Galmudug State University</p>`
  )

  return sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? `admissions@${env.EMAIL_DOMAIN}`,
  })
}

/** Splits recipients into Resend-safe batches (max 50 per request). */
export function chunkRecipients(emails: string[], size = 50) {
  const chunks: string[][] = []
  for (let i = 0; i < emails.length; i += size) chunks.push(emails.slice(i, i + size))
  return chunks
}
