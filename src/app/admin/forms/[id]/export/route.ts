import { getCurrentUser } from "@/lib/auth/server"
import { getFormById, getFormSubmissions } from "@/lib/queries"

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null) return ""
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (Array.isArray(value)) return value.map(String).join("; ")
  return String(value)
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 })

  const { id } = await ctx.params
  const [form, responses] = await Promise.all([getFormById(id), getFormSubmissions(id)])
  if (!form) return new Response("Not found", { status: 404 })

  const header = ["Name", "Email", "Submitted", ...form.fields.map((field) => field.label)]
  const rows = [header]
  for (const response of responses) {
    rows.push([
      response.name,
      response.email,
      new Date(response.createdAt).toISOString(),
      ...form.fields.map((field) => formatAnswer(response.answers[field.id])),
    ])
  }

  const csv =
    "\uFEFF" + rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(",")).join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${form.slug}-responses.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
