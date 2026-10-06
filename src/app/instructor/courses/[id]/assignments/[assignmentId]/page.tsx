import { notFound } from "next/navigation"

import { GradingView } from "@/components/admin/grading-view"
import { requireInstructor } from "@/lib/auth/server"
import { getAssignmentWithSubmissions } from "@/lib/queries"

export const metadata = { title: "Grade assignment" }

export default async function InstructorGradeAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  const user = await requireInstructor()
  const { assignmentId } = await params
  const data = await getAssignmentWithSubmissions(assignmentId)
  if (!data) notFound()
  if (user.role !== "ADMIN" && data.course?.instructorId !== user.id) notFound()
  return <GradingView data={data} basePath="/instructor" />
}
