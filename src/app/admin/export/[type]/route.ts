import type { EnrollmentStatus, PublishStatus, UserStatus } from "@/db/types"
import { getCurrentUser } from "@/lib/auth/server"
import { csvResponse, isoDate } from "@/lib/csv"
import { fullName } from "@/lib/format"
import {
  getAdminBundles,
  getAdminCourses,
  getAdminForms,
  getAdminPrograms,
  getAdminSemesterEnrollments,
  getCategories,
  getCourseStudents,
  getInstructors,
  getStudents,
} from "@/lib/queries"

function pick<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ type: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 })

  const { type } = await ctx.params
  const url = new URL(request.url)
  const search = url.searchParams.get("q") ?? undefined
  const statusParam = url.searchParams.get("status")
  const courseId = url.searchParams.get("courseId")

  const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`

  switch (type) {
    case "courses": {
      const rows = await getAdminCourses({
        search,
        status: pick<PublishStatus>(statusParam, ["DRAFT", "PUBLISHED", "ARCHIVED"]),
      })
      return csvResponse(
        filename,
        ["Title", "Slug", "Category", "Instructor", "Status", "Lessons", "Enrollments", "Updated"],
        rows.map((course) => [
          course.title,
          course.slug,
          course.category?.name ?? "",
          fullName(course.instructor.profile, ""),
          course.status,
          course._count.lessons,
          course._count.enrollments,
          isoDate(course.updatedAt),
        ])
      )
    }
    case "bundles": {
      const rows = await getAdminBundles({
        search,
        status: pick<PublishStatus>(statusParam, ["DRAFT", "PUBLISHED", "ARCHIVED"]),
      })
      return csvResponse(
        filename,
        ["Title", "Slug", "Status", "Courses", "Enrollments", "Updated"],
        rows.map((bundle) => [
          bundle.title,
          bundle.slug,
          bundle.status,
          bundle._count.courses,
          bundle._count.enrollments,
          isoDate(bundle.updatedAt),
        ])
      )
    }
    case "programs": {
      const rows = await getAdminPrograms({
        search,
        status: pick<PublishStatus>(statusParam, ["DRAFT", "PUBLISHED", "ARCHIVED"]),
      })
      return csvResponse(
        filename,
        ["Title", "Code", "Level", "Status", "Semesters", "Enrollments", "Updated"],
        rows.map((program) => [
          program.title,
          program.code ?? "",
          program.level,
          program.status,
          `${program._count.semesters}/${program.semesterCount}`,
          program._count.enrollments,
          isoDate(program.updatedAt),
        ])
      )
    }
    case "categories": {
      const rows = await getCategories({ search })
      return csvResponse(
        filename,
        ["Name", "Slug", "Courses"],
        rows.map((category) => [category.name, category.slug, category._count.courses])
      )
    }
    case "students": {
      const rows = await getStudents({
        search,
        status: pick<UserStatus>(statusParam, ["ACTIVE", "SUSPENDED"]),
      })
      return csvResponse(
        filename,
        ["Name", "Email", "Status", "Enrollments", "Joined"],
        rows.map((student) => [
          fullName(student.profile, student.email),
          student.email,
          student.status,
          student._count.enrollments,
          isoDate(student.createdAt),
        ])
      )
    }
    case "instructors": {
      const rows = await getInstructors({
        search,
        status: pick<UserStatus>(statusParam, ["ACTIVE", "SUSPENDED"]),
      })
      return csvResponse(
        filename,
        ["Name", "Email", "Status", "Courses", "Joined"],
        rows.map((instructor) => [
          fullName(instructor.profile, instructor.email),
          instructor.email,
          instructor.status,
          instructor._count.instructorCourses,
          isoDate(instructor.createdAt),
        ])
      )
    }
    case "enrollments": {
      const rows = await getAdminSemesterEnrollments({
        search,
        status: pick<EnrollmentStatus>(statusParam, ["ACTIVE", "EXPIRED", "CANCELLED"]),
      })
      return csvResponse(
        filename,
        ["Student", "Email", "Semester", "Source", "Status", "Started", "Expires"],
        rows.map((enrollment) => [
          fullName(enrollment.student.profile, enrollment.student.email),
          enrollment.student.email,
          enrollment.bundle.title,
          enrollment.source,
          enrollment.status,
          isoDate(enrollment.startedAt),
          enrollment.expiresAt ? isoDate(enrollment.expiresAt) : "Lifetime",
        ])
      )
    }
    case "forms": {
      const rows = await getAdminForms({
        search,
        status: pick<PublishStatus>(statusParam, ["DRAFT", "PUBLISHED", "ARCHIVED"]),
      })
      return csvResponse(
        filename,
        ["Title", "Slug", "Status", "Fields", "Responses", "Updated"],
        rows.map((form) => [
          form.title,
          form.slug,
          form.status,
          form._count.fields,
          form._count.responses,
          isoDate(form.updatedAt),
        ])
      )
    }
    case "course-students": {
      if (!courseId) return new Response("Missing courseId", { status: 400 })
      const rows = await getCourseStudents(courseId, {
        search,
        status: pick<EnrollmentStatus>(statusParam, ["ACTIVE", "EXPIRED", "CANCELLED"]),
      })
      return csvResponse(
        filename,
        ["Student", "Email", "Status", "Progress", "Completed", "Total", "Access expires", "Enrolled"],
        rows.map((row) => [
          fullName(row.student.profile, row.student.email),
          row.student.email,
          row.enrollment.status,
          `${row.progress}%`,
          row.completed,
          row.total,
          row.enrollment.expiresAt ? isoDate(row.enrollment.expiresAt) : "Lifetime",
          isoDate(row.enrollment.createdAt),
        ])
      )
    }
    default:
      return new Response("Unknown export type", { status: 404 })
  }
}
