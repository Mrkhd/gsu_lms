import Link from "next/link"
import type { PublishStatus } from "@/db/types"
import { BookOpen, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { STATUS_OPTIONS, TableFilters } from "@/components/admin/table-filters"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireInstructor } from "@/lib/auth/server"
import { formatShortDate } from "@/lib/format"
import { getInstructorCourses } from "@/lib/queries"
import { setCourseStatusAction } from "@/server/actions/courses"

export const metadata = { title: "My courses" }

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireInstructor()
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const status =
    typeof params.status === "string" &&
    ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(params.status)
      ? (params.status as PublishStatus)
      : undefined
  const courses = await getInstructorCourses(user.id, user.role === "ADMIN", { search, status })

  return (
    <div>
      <PageHeader
        title="My courses"
        description="Create and manage the courses you teach."
        actions={
          <Button asChild size="sm">
            <Link href="/instructor/courses/new">
              <Plus />
              New course
            </Link>
          </Button>
        }
      />

      <TableFilters
        basePath="/instructor/courses"
        searchPlaceholder="Search courses"
        selects={[{ key: "status", placeholder: "All statuses", options: STATUS_OPTIONS }]}
      />

      {courses.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Students</TableHead>

                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="max-w-56">
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="font-medium hover:underline"
                    >
                      {course.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={course.status} />
                  </TableCell>
                  <TableCell>{course._count.lessons}</TableCell>
                  <TableCell>{course._count.enrollments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(course.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/instructor/courses/${course.id}`}>Manage</Link>
                      </Button>
                      {course.status !== "PUBLISHED" ? (
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={setCourseStatusAction.bind(null, course.id, "PUBLISHED")}
                        >
                          Publish
                        </ActionButton>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start teaching."
          action={
            <Button asChild>
              <Link href="/instructor/courses/new">Create course</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
