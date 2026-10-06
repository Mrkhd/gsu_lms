import { notFound } from "next/navigation"

import { GradingView } from "@/components/admin/grading-view"
import { requireAdmin } from "@/lib/auth/server"
import { getAssignmentWithSubmissions } from "@/lib/queries"

export const metadata = { title: "Grade assignment" }

export default async function AdminGradeAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>
}) {
  await requireAdmin()
  const { assignmentId } = await params
  const data = await getAssignmentWithSubmissions(assignmentId)
  if (!data) notFound()
  return <GradingView data={data} basePath="/admin" />
}
