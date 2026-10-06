import { CourseEditor } from "@/components/admin/course-editor"

export const metadata = { title: "Edit course" }

export default async function InstructorEditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CourseEditor courseId={id} viewerRole="INSTRUCTOR" />
}
