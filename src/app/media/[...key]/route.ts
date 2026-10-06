import { eq, or } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courses, lessons } from "@/db/schema"
import { getObject } from "@/db/storage"
import { getCourseAccess } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"

export async function GET(
  _request: Request,
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

  const headers = new Headers()
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream")
  headers.set("ETag", object.httpEtag)
  headers.set("Cache-Control", "private, max-age=3600")

  return new Response(object.body as unknown as BodyInit, { headers })
}
