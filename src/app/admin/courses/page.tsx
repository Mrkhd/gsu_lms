import Link from "next/link"
import type { PublishStatus } from "@/db/types"
import { BookOpen, Plus } from "lucide-react"

import { ActionButton } from "@/components/action-button"
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
import { formatPrice, formatShortDate, fullName } from "@/lib/format"
import { getAdminCourses } from "@/lib/queries"
import { deleteCourseAction, setCourseStatusAction } from "@/server/actions/courses"

export const metadata = { title: "Courses" }

const FILTERS: { label: string; value?: PublishStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Archived", value: "ARCHIVED" },
]

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
          <Button asChild size="sm">
            <Link href="/admin/courses/new">
              <Plus />
              New course
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((filter) => {
          const active = filter.value === status || (!filter.value && !status)
          const href = filter.value ? `/admin/courses?status=${filter.value}` : "/admin/courses"
          return (
            <Button key={filter.label} asChild size="sm" variant={active ? "default" : "outline"}>
              <Link href={href}>{filter.label}</Link>
            </Button>
          )
        })}
      </div>

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
                <TableHead>Price</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="max-w-56">
                    <Link href={`/admin/courses/${course.id}`} className="font-medium hover:underline">
                      {course.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
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
                  <TableCell>{formatPrice(course.price)}</TableCell>
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
