import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"

import { AccessBlocked } from "@/components/learn/access-blocked"
import { StudentAssignments } from "@/components/learn/student-assignments"
import { Button } from "@/components/ui/button"
import { getCourseAccess } from "@/lib/access"
import { requireUser } from "@/lib/auth/server"
import { getLearningCourse, getStudentCourseAssignments } from "@/lib/queries"

export const metadata = { title: "Assignments" }

export default async function CourseAssignmentsPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>
}) {
  const { courseSlug } = await params
  const user = await requireUser()
  const data = await getLearningCourse(user.id, courseSlug)
  if (!data) notFound()

  const access = await getCourseAccess(user.id, data.course.id)
  if (!access.hasAccess) {
    return (
      <AccessBlocked
        course={{ slug: data.course.slug, title: data.course.title }}
        reason={access.reason === "ACTIVE" ? "NONE" : access.reason}
        expiresAt={access.enrollment?.expiresAt ?? null}
      />
    )
  }

  const assignments = await getStudentCourseAssignments(user.id, data.course.id)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/learn/${courseSlug}`}>
            <ArrowLeft />
            Back to course
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <Home />
            Home
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Assignments</h1>
        <p className="text-sm text-muted-foreground">{data.course.title}</p>
      </div>
      <StudentAssignments assignments={assignments} />
    </div>
  )
}
