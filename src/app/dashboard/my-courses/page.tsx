import Link from "next/link"
import { BookOpen } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StudentCourseCard } from "@/components/student-course-card"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/server"
import { getStudentCourses } from "@/lib/queries"

export const metadata = { title: "My courses" }

export default async function MyCoursesPage() {
  const user = await requireUser()
  const items = await getStudentCourses(user.id)

  return (
    <div>
      <PageHeader
        title="My courses"
        description="All courses you have access to, including access expiry dates."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">Browse catalog</Link>
          </Button>
        }
      />
      {items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <StudentCourseCard key={item.enrollment.id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No enrolled courses"
          description="Once you enroll in a course it will show up here."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
