import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { assignmentSubmissions, courses } from "@/db/schema"
import { getObject } from "@/db/storage"
import { getCurrentUser } from "@/lib/auth/server"

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { submissionId } = await ctx.params
  const db = getDb()
  const [submission] = await db
    .select({
      id: assignmentSubmissions.id,
      studentId: assignmentSubmissions.studentId,
      courseId: assignmentSubmissions.courseId,
      fileKey: assignmentSubmissions.fileKey,
      fileName: assignmentSubmissions.fileName,
    })
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.id, submissionId))
    .limit(1)
  if (!submission) return new Response("Not found", { status: 404 })

  const [course] = await db
    .select({ instructorId: courses.instructorId })
    .from(courses)
    .where(eq(courses.id, submission.courseId))
    .limit(1)

  const allowed =
    user.role === "ADMIN" ||
    user.id === submission.studentId ||
    (user.role === "INSTRUCTOR" && course?.instructorId === user.id)

  if (!allowed) return new Response("Forbidden", { status: 403 })

  const object = await getObject(submission.fileKey)
  if (!object) return new Response("Not found", { status: 404 })

  const headers = new Headers()
  headers.set("Content-Type", "application/pdf")
  headers.set("Content-Disposition", `inline; filename="${submission.fileName.replace(/"/g, "")}"`)
  headers.set("Cache-Control", "private, max-age=60")
  headers.set("ETag", object.etag)

  return new Response(object.body as unknown as BodyInit, { headers })
}
