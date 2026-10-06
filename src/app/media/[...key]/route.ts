import { getObject } from "@/db/storage"
import { getSessionUser } from "@/lib/auth/server"

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const user = await getSessionUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const params = await ctx.params
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key
  if (!key) return new Response("Not found", { status: 404 })

  const object = await getObject(key)
  if (!object) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  if (object.httpMetadata?.contentType) {
    headers.set("Content-Type", object.httpMetadata.contentType)
  } else {
    headers.set("Content-Type", "application/octet-stream")
  }
  headers.set("ETag", object.httpEtag)
  headers.set("Cache-Control", "private, max-age=3600")

  return new Response(object.body as unknown as BodyInit, { headers })
}
