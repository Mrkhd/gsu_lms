import { notFound, redirect } from "next/navigation"

import { getCourseAccess } from "@/lib/access"
import { requireUser } from "@/lib/auth/server"
import { getLearningCourse } from "@/lib/queries"

export default async function LearnCoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const user = await requireUser()
  const data = await getLearningCourse(user.id, courseSlug)

  if (!data) notFound()

  const access = await getCourseAccess(user.id, data.course.id)
  if (!access.hasAccess) redirect(`/courses/${courseSlug}`)

  if (!data.resumeLessonId) redirect(`/courses/${courseSlug}`)

  redirect(`/learn/${courseSlug}/${data.resumeLessonId}`)
}
