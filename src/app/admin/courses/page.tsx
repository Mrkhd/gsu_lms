import Link from "next/link"
import type { PublishStatus } from "@/db/types"
import { BookOpen, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { ExportButton } from "@/components/admin/export-button"
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
import { requireAdmin } from "@/lib/auth/server"
import { formatShortDate, fullName } from "@/lib/format"
import { getAdminCourses } from "@/lib/queries"
import { deleteCourseAction, setCourseStatusAction } from "@/server/actions/courses"

export const metadata = { title: "Courses" }

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const status =
    typeof params.status === "string" &&
    ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(params.status)
      ? (params.status as PublishStatus)
      : undefined

  const courses = await getAdminCourses({ search, status })

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Create, publish and manage every course on the platform."
        actions={
          <div className="flex items-center gap-2">
            <ExportButton type="courses" />
            <Button asChild size="sm">
              <Link href="/admin/courses/new">
                <Plus />
                New course
              </Link>
            </Button>
          </div>
        }
      />

      <TableFilters
        basePath="/admin/courses"
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
                <TableHead>Instructor</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="max-w-56 overflow-hidden">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {course.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {course.category?.name ?? "Uncategorised"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={course.status} />
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-sm">
                    {fullName(course.instructor.profile, "—")}
                  </TableCell>
                  <TableCell>{course._count.lessons}</TableCell>
                  <TableCell>{course._count.enrollments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(course.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/courses/${course.id}`}>Edit</Link>
                      </Button>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        action={setCourseStatusAction.bind(
                          null,
                          course.id,
                          course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
                        )}
                      >
                        {course.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        action={deleteCourseAction.bind(null, course.id)}
                        confirm={{
                          title: "Delete this course?",
                          description:
                            "Sections, lessons and enrollments will be permanently removed.",
                          confirmLabel: "Delete course",
                        }}
                      >
                        Delete
                      </ActionButton>
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
          title="No courses found"
          description="Create your first course to get started."
          action={
            <Button asChild>
              <Link href="/admin/courses/new">Create course</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
