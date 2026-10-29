import { eq, or } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses, lessons } from "@/db/schema"
import { getObject } from "@/db/storage"
import { getCourseAccess } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"

export async function GET(
  request: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const user = await getCurrentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const params = await ctx.params
  const key = Array.isArray(params.key) ? params.key.join("/") : params.key
  if (!key) return new Response("Not found", { status: 404 })

  // Course media is only served to users with access to the owning course.
  const mediaPath = `/media/${key}`
  const db = getDb()
  const [lesson] = await db
    .select({ id: lessons.id, courseId: lessons.courseId })
    .from(lessons)
    .where(or(eq(lessons.videoUrl, mediaPath), eq(lessons.pdfUrl, mediaPath)))
    .limit(1)
  if (!lesson) return new Response("Not found", { status: 404 })

  const [course] = await db
    .select({ instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, lesson.courseId))
    .limit(1)

  let allowed = user.role === "ADMIN" || course?.instructorId === user.id
  if (!allowed) {
    const access = await getCourseAccess(user.id, lesson.courseId)
    allowed = access.hasAccess
  }
  if (!allowed) return new Response("Forbidden", { status: 403 })

  const object = await getObject(key)
  if (!object) return new Response("Not found", { status: 404 })

  const total = object.size
  const baseHeaders: Record<string, string> = {
    "Content-Type": object.contentType,
    ETag: object.etag,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "X-Content-Type-Options": "nosniff",
  }

  const rangeHeader = request.headers.get("range")
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
    if (!match) {
      return new Response("Invalid range", {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      })
    }

    let start = match[1] ? Number(match[1]) : 0
    let end = match[2] ? Number(match[2]) : total - 1

    if (!match[1] && match[2]) {
      const suffix = Number(match[2])
      start = Math.max(0, total - suffix)
      end = total - 1
    }

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      return new Response("Range not satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      })
    }

    end = Math.min(end, total - 1)
    const chunk = object.body.subarray(start, end + 1)
    return new Response(chunk as unknown as BodyInit, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${total}`,
      },
    })
  }

  return new Response(object.body as unknown as BodyInit, {
    headers: { ...baseHeaders, "Content-Length": String(total) },
  })
}
