import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  assignmentSubmissions,
  assignments,
  bundleCourses,
  bundleEnrollments,
  bundles,
  courseCategories,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  orderItems,
  orders,
  profiles,
  programEnrollments,
  programSemesters,
  programs,
  reviews,
  users,
} from "@/db/schema"
import type { PublishStatus } from "@/db/types"
import { isEnrollmentActive } from "@/lib/access"
import { percent } from "@/lib/format"

export const PAGE_SIZE = 9

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "popular"

const instructorWith = {
  with: { profile: true },
} as const

async function lessonCounts(courseIds: string[]) {
  if (!courseIds.length) return new Map<string, number>()
  const db = getDb()
  const rows = await db
    .select({ courseId: lessons.courseId, value: count() })
    .from(lessons)
    .where(inArray(lessons.courseId, courseIds))
    .groupBy(lessons.courseId)
  return new Map(rows.map((r) => [r.courseId, Number(r.value)]))
}

async function enrollmentCountsByCourse(courseIds: string[]) {
  if (!courseIds.length) return new Map<string, number>()
  const db = getDb()
  const rows = await db
    .select({ courseId: enrollments.courseId, value: count() })
    .from(enrollments)
    .where(inArray(enrollments.courseId, courseIds))
    .groupBy(enrollments.courseId)
  return new Map(rows.map((r) => [r.courseId, Number(r.value)]))
}

async function reviewCounts(courseIds: string[]) {
  if (!courseIds.length) return new Map<string, number>()
  const db = getDb()
  const rows = await db
    .select({ courseId: reviews.courseId, value: count() })
    .from(reviews)
    .where(inArray(reviews.courseId, courseIds))
    .groupBy(reviews.courseId)
  return new Map(rows.map((r) => [r.courseId, Number(r.value)]))
}

async function enrollmentCountsByBundle(bundleIds: string[]) {
  if (!bundleIds.length) return new Map<string, number>()
  const db = getDb()
  const rows = await db
    .select({ bundleId: bundleEnrollments.bundleId, value: count() })
    .from(bundleEnrollments)
    .where(inArray(bundleEnrollments.bundleId, bundleIds))
    .groupBy(bundleEnrollments.bundleId)
  return new Map(rows.map((r) => [r.bundleId, Number(r.value)]))
}

async function enrollmentCountsByProgram(programIds: string[]) {
  if (!programIds.length) return new Map<string, number>()
  const db = getDb()
  const rows = await db
    .select({ programId: programEnrollments.programId, value: count() })
    .from(programEnrollments)
    .where(inArray(programEnrollments.programId, programIds))
    .groupBy(programEnrollments.programId)
  return new Map(rows.map((r) => [r.programId, Number(r.value)]))
}

async function withLessonAndEnrollmentCounts<
  T extends { id: string },
>(list: T[]) {
  const ids = list.map((c) => c.id)
  const [lessonMap, enrollmentMap] = await Promise.all([
    lessonCounts(ids),
    enrollmentCountsByCourse(ids),
  ])
  return list.map((course) => ({
    ...course,
    _count: {
      lessons: lessonMap.get(course.id) ?? 0,
      enrollments: enrollmentMap.get(course.id) ?? 0,
    },
  }))
}

// ---------------------------------------------------------------------------
// Public catalog
// ---------------------------------------------------------------------------

export async function getCategories() {
  const db = getDb()
  const rows = await db
    .select({
      id: courseCategories.id,
      name: courseCategories.name,
      slug: courseCategories.slug,
      description: courseCategories.description,
      createdAt: courseCategories.createdAt,
      updatedAt: courseCategories.updatedAt,
      courseCount: count(courses.id),
    })
    .from(courseCategories)
    .leftJoin(courses, eq(courses.categoryId, courseCategories.id))
    .groupBy(courseCategories.id)
    .orderBy(asc(courseCategories.name))
  return rows.map(({ courseCount, ...category }) => ({
    ...category,
    _count: { courses: Number(courseCount) },
  }))
}

export async function getPublishedCourses(options: {
  search?: string
  categorySlug?: string
  sort?: CatalogSort
  page?: number
  pageSize?: number
}) {
  const { search, categorySlug, sort = "newest", page = 1, pageSize = PAGE_SIZE } = options
  const db = getDb()

  const where = and(
    eq(courses.status, "PUBLISHED"),
    search
      ? or(like(courses.title, `%${search}%`), like(courses.shortDescription, `%${search}%`))
      : undefined,
    categorySlug ? eq(courseCategories.slug, categorySlug) : undefined
  )

  const popular = sql<number>`(select count(*) from "enrollments" where "enrollments"."course_id" = "courses"."id")`
  const orderBy =
    sort === "price-asc"
      ? [asc(courses.price)]
      : sort === "price-desc"
        ? [desc(courses.price)]
        : sort === "popular"
          ? [desc(popular)]
          : [desc(courses.publishedAt), desc(courses.createdAt)]

  const [items, totalRows] = await Promise.all([
    db.query.courses.findMany({
      where,
      with: { category: true, instructor: instructorWith },
      orderBy,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db
      .select({ value: count() })
      .from(courses)
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .where(where),
  ])

  const withCounts = await withLessonAndEnrollmentCounts(items)
  const total = Number(totalRows[0]?.value ?? 0)

  return { items: withCounts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function getCourseBySlug(slug: string) {
  const db = getDb()
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      category: true,
      instructor: { with: { profile: true } },
      sections: {
        with: { lessons: true },
        orderBy: (s, { asc: a }) => [a(s.position)],
      },
      reviews: {
        with: { student: { with: { profile: true } } },
        orderBy: (r, { desc: d }) => [d(r.createdAt)],
        limit: 10,
      },
    },
  })
  if (!course) return null

  const [lessonMap, enrollmentMap, reviewMap] = await Promise.all([
    lessonCounts([course.id]),
    enrollmentCountsByCourse([course.id]),
    reviewCounts([course.id]),
  ])
  return {
    ...course,
    _count: {
      lessons: lessonMap.get(course.id) ?? 0,
      enrollments: enrollmentMap.get(course.id) ?? 0,
      reviews: reviewMap.get(course.id) ?? 0,
    },
  }
}

export async function getPublishedBundles(options: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const { search, page = 1, pageSize = PAGE_SIZE } = options
  const db = getDb()
  const where = and(
    eq(bundles.status, "PUBLISHED"),
    search ? or(like(bundles.title, `%${search}%`), like(bundles.shortDescription, `%${search}%`)) : undefined
  )

  const [items, totalRows] = await Promise.all([
    db.query.bundles.findMany({
      where,
      with: { courses: { with: { course: true }, orderBy: (c, { asc: a }) => [a(c.position)] } },
      orderBy: [desc(bundles.publishedAt), desc(bundles.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ value: count() }).from(bundles).where(where),
  ])

  const total = Number(totalRows[0]?.value ?? 0)
  return {
    items: items.map((bundle) => ({
      ...bundle,
      _count: { courses: bundle.courses.length },
      courses: bundle.courses.map((link) => ({ course: link.course })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getBundleBySlug(slug: string) {
  const db = getDb()
  const bundle = await db.query.bundles.findFirst({
    where: eq(bundles.slug, slug),
    with: {
      courses: {
        with: {
          course: { with: { category: true, instructor: instructorWith } },
        },
        orderBy: (c, { asc: a }) => [a(c.position)],
      },
    },
  })
  if (!bundle) return null

  const courseIds = bundle.courses.map((link) => link.course.id)
  const lessonMap = await lessonCounts(courseIds)

  return {
    ...bundle,
    _count: { courses: bundle.courses.length },
    courses: bundle.courses.map((link) => ({
      ...link,
      course: { ...link.course, _count: { lessons: lessonMap.get(link.course.id) ?? 0 } },
    })),
  }
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export async function getStudentCourses(studentId: string) {
  const db = getDb()
  const rows = await db.query.enrollments.findMany({
    where: eq(enrollments.studentId, studentId),
    with: { course: { with: { category: true, instructor: instructorWith } } },
    orderBy: (e, { desc: d }) => [d(e.updatedAt)],
  })

  const courseIds = rows.map((r) => r.courseId)
  const [lessonMap, completedRows] = await Promise.all([
    lessonCounts(courseIds),
    courseIds.length
      ? db
          .select({ courseId: lessonProgress.courseId, value: count() })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.studentId, studentId),
              eq(lessonProgress.completed, true),
              inArray(lessonProgress.courseId, courseIds)
            )
          )
          .groupBy(lessonProgress.courseId)
      : Promise.resolve([] as { courseId: string; value: number }[]),
  ])
  const completedMap = new Map(completedRows.map((r) => [r.courseId, Number(r.value)]))

  return rows.map((enrollment) => {
    const total = lessonMap.get(enrollment.courseId) ?? 0
    const completed = completedMap.get(enrollment.courseId) ?? 0
    return {
      enrollment,
      course: { ...enrollment.course, _count: { lessons: total } },
      completed,
      total,
      progress: percent(completed, total),
    }
  })
}

export type StudentCourseItem = Awaited<ReturnType<typeof getStudentCourses>>[number]

export async function getStudentOrders(studentId: string) {
  const db = getDb()
  const rows = await db.query.orders.findMany({
    where: eq(orders.studentId, studentId),
    with: { items: true },
    orderBy: (o, { desc: d }) => [d(o.createdAt)],
  })
  return rows
}

export async function getStudentBundleEnrollments(studentId: string) {
  const db = getDb()
  const rows = await db.query.bundleEnrollments.findMany({
    where: eq(bundleEnrollments.studentId, studentId),
    with: {
      bundle: {
        with: {
          courses: { with: { course: true }, orderBy: (c, { asc: a }) => [a(c.position)] },
        },
      },
    },
    orderBy: (e, { desc: d }) => [d(e.updatedAt)],
  })
  return rows.map((row) => ({
    ...row,
    bundle: {
      ...row.bundle,
      _count: { courses: row.bundle.courses.length },
      courses: row.bundle.courses.map((link) => ({ course: link.course })),
    },
  }))
}

export async function getLearningCourse(studentId: string, slug: string) {
  const db = getDb()
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      instructor: { with: { profile: true } },
      category: true,
      sections: {
        with: {
          lessons: {
            with: { progress: { where: eq(lessonProgress.studentId, studentId) } },
            orderBy: (l, { asc: a }) => [a(l.position)],
          },
        },
        orderBy: (s, { asc: a }) => [a(s.position)],
      },
    },
  })
  if (!course) return null

  const flat = course.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({ ...lesson, sectionTitle: section.title }))
  )
  const completed = flat.filter((lesson) => lesson.progress[0]?.completed).length
  const total = flat.length

  const lastViewed =
    flat
      .filter((lesson) => lesson.progress[0])
      .sort(
        (a, b) =>
          (b.progress[0]?.lastViewedAt?.getTime() ?? 0) -
          (a.progress[0]?.lastViewedAt?.getTime() ?? 0)
      )[0] ?? null
  const firstIncomplete = flat.find((lesson) => !lesson.progress[0]?.completed) ?? null
  const resumeLesson = lastViewed && !lastViewed.progress[0]?.completed ? lastViewed : firstIncomplete
  const lastLesson = flat[flat.length - 1] ?? null

  return {
    course,
    lessons: flat,
    completed,
    total,
    progress: percent(completed, total),
    resumeLessonId: (resumeLesson ?? lastLesson)?.id ?? null,
    sectionProgress: course.sections.map((section) => ({
      id: section.id,
      title: section.title,
      total: section.lessons.length,
      completed: section.lessons.filter((lesson) =>
        flat.find((l) => l.id === lesson.id)?.progress[0]?.completed
      ).length,
    })),
  }
}

export type LearningCourse = NonNullable<Awaited<ReturnType<typeof getLearningCourse>>>

// ---------------------------------------------------------------------------
// Admin / instructor
// ---------------------------------------------------------------------------

export async function getAdminStats() {
  const db = getDb()
  const [studentsRow, coursesRow, bundlesRow, ordersRow, revenueRow, recentOrders] =
    await Promise.all([
      db.select({ value: count() }).from(users).where(eq(users.role, "STUDENT")),
      db.select({ value: count() }).from(courses),
      db.select({ value: count() }).from(bundles),
      db.select({ value: count() }).from(orders),
      db
        .select({ value: sql<number>`coalesce(sum(${orders.total}), 0)` })
        .from(orders)
        .where(eq(orders.status, "PAID")),
      db.query.orders.findMany({
        with: { student: { with: { profile: true } }, items: true },
        orderBy: (o, { desc: d }) => [d(o.createdAt)],
        limit: 6,
      }),
    ])

  return {
    students: Number(studentsRow[0]?.value ?? 0),
    courses: Number(coursesRow[0]?.value ?? 0),
    bundles: Number(bundlesRow[0]?.value ?? 0),
    orders: Number(ordersRow[0]?.value ?? 0),
    revenue: Number(revenueRow[0]?.value ?? 0),
    recentOrders: recentOrders.map((order) => ({
      ...order,
      student: {
        email: order.student.email,
        profile: order.student.profile,
      },
    })),
  }
}

export async function getInstructorStats(instructorId: string) {
  const db = getDb()
  const [coursesRow, publishedRow, enrollmentsRow] = await Promise.all([
    db.select({ value: count() }).from(courses).where(eq(courses.instructorId, instructorId)),
    db
      .select({ value: count() })
      .from(courses)
      .where(and(eq(courses.instructorId, instructorId), eq(courses.status, "PUBLISHED"))),
    db
      .select({ value: count() })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId)),
  ])
  return {
    courses: Number(coursesRow[0]?.value ?? 0),
    published: Number(publishedRow[0]?.value ?? 0),
    enrollments: Number(enrollmentsRow[0]?.value ?? 0),
  }
}

export async function getInstructorCourses(instructorId: string, isAdmin = false) {
  const db = getDb()
  const rows = await db.query.courses.findMany({
    where: isAdmin ? undefined : eq(courses.instructorId, instructorId),
    with: { category: true },
    orderBy: (c, { desc: d }) => [d(c.updatedAt)],
  })
  const ids = rows.map((c) => c.id)
  const [lessonMap, enrollmentMap] = await Promise.all([
    lessonCounts(ids),
    enrollmentCountsByCourse(ids),
  ])
  const sectionRows = ids.length
    ? await db
        .select({ courseId: courses.id })
        .from(courses)
        .where(inArray(courses.id, ids))
    : []
  void sectionRows
  return rows.map((course) => ({
    ...course,
    _count: {
      lessons: lessonMap.get(course.id) ?? 0,
      enrollments: enrollmentMap.get(course.id) ?? 0,
      sections: 0,
    },
  }))
}

export async function getCourseStudents(courseId: string) {
  const db = getDb()
  const rows = await db.query.enrollments.findMany({
    where: eq(enrollments.courseId, courseId),
    with: { student: { with: { profile: true } } },
    orderBy: (e, { desc: d }) => [d(e.createdAt)],
  })

  const completed = await db
    .select({ studentId: lessonProgress.studentId, value: count() })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.courseId, courseId), eq(lessonProgress.completed, true)))
    .groupBy(lessonProgress.studentId)
  const completedMap = new Map(completed.map((c) => [c.studentId, Number(c.value)]))
  const [totalRow] = await db
    .select({ value: count() })
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
  const total = Number(totalRow?.value ?? 0)

  return rows.map((enrollment) => {
    const done = completedMap.get(enrollment.studentId) ?? 0
    return {
      enrollment,
      student: enrollment.student,
      completed: done,
      total,
      progress: percent(done, total),
    }
  })
}

export async function getAdminCourses(options: { search?: string; status?: PublishStatus } = {}) {
  const db = getDb()
  const where = and(
    options.status ? eq(courses.status, options.status) : undefined,
    options.search ? like(courses.title, `%${options.search}%`) : undefined
  )
  const rows = await db.query.courses.findMany({
    where,
    with: { category: true, instructor: instructorWith },
    orderBy: (c, { desc: d }) => [d(c.updatedAt)],
  })
  return withLessonAndEnrollmentCounts(rows)
}

export async function getAdminBundles() {
  const db = getDb()
  const rows = await db.query.bundles.findMany({
    with: { courses: { with: { course: true } }, programSemesters: true },
    orderBy: (b, { desc: d }) => [d(b.updatedAt)],
  })
  const ids = rows.map((b) => b.id)
  const enrollmentMap = await enrollmentCountsByBundle(ids)
  return rows.map((bundle) => ({
    ...bundle,
    _count: {
      courses: bundle.courses.length,
      enrollments: enrollmentMap.get(bundle.id) ?? 0,
    },
  }))
}

export async function getInstructors() {
  const db = getDb()
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      profile: profiles,
      courseCount: count(courses.id),
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(courses, eq(courses.instructorId, users.id))
    .where(eq(users.role, "INSTRUCTOR"))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
  return rows.map(({ courseCount, ...instructor }) => ({
    ...instructor,
    _count: { instructorCourses: Number(courseCount) },
  }))
}

export async function getStudents(options: { search?: string } = {}) {
  const db = getDb()
  const where = and(
    eq(users.role, "STUDENT"),
    options.search
      ? or(
          like(users.email, `%${options.search}%`),
          like(profiles.firstName, `%${options.search}%`),
          like(profiles.lastName, `%${options.search}%`)
        )
      : undefined
  )
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      profile: profiles,
      enrollmentCount: sql<number>`(select count(*) from ${enrollments} where ${enrollments.studentId} = ${users.id})`,
      orderCount: sql<number>`(select count(*) from ${orders} where ${orders.studentId} = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
  return rows.map(({ enrollmentCount, orderCount, ...student }) => ({
    ...student,
    _count: { enrollments: Number(enrollmentCount), orders: Number(orderCount) },
  }))
}

export async function getAdminOrders(options: { search?: string } = {}) {
  const db = getDb()
  const where = options.search ? like(users.email, `%${options.search}%`) : undefined
  const rows = await db.query.orders.findMany({
    with: {
      student: { with: { profile: true } },
      items: true,
    },
    orderBy: (o, { desc: d }) => [d(o.createdAt)],
    limit: 100,
  })
  void where
  return rows.map((order) => ({
    ...order,
    student: { id: order.student.id, email: order.student.email, profile: order.student.profile },
  }))
}

export async function getAdminEnrollments(options: { search?: string } = {}) {
  const db = getDb()
  const where = options.search ? like(users.email, `%${options.search}%`) : undefined
  const rows = await db
    .select({
      enrollment: enrollments,
      studentId: users.id,
      studentEmail: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
      courseId: courses.id,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(where)
    .orderBy(desc(enrollments.createdAt))
    .limit(100)
  return rows.map((row) => ({
    ...row.enrollment,
    student: {
      id: row.studentId,
      email: row.studentEmail,
      profile: { firstName: row.firstName, lastName: row.lastName, avatarUrl: row.avatarUrl },
    },
    course: { id: row.courseId, title: row.courseTitle, slug: row.courseSlug },
  }))
}

// ---------------------------------------------------------------------------
// University programs
// ---------------------------------------------------------------------------

export async function getPublishedPrograms(options: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const { search, page = 1, pageSize = PAGE_SIZE } = options
  const db = getDb()
  const where = and(
    eq(programs.status, "PUBLISHED"),
    search
      ? or(like(programs.title, `%${search}%`), like(programs.shortDescription, `%${search}%`), like(programs.code, `%${search}%`))
      : undefined
  )
  const [items, totalRows] = await Promise.all([
    db.query.programs.findMany({
      where,
      with: { semesters: { with: { bundle: true } } },
      orderBy: [desc(programs.publishedAt), desc(programs.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db.select({ value: count() }).from(programs).where(where),
  ])
  const enrollmentMap = await enrollmentCountsByProgram(items.map((p) => p.id))
  const total = Number(totalRows[0]?.value ?? 0)
  return {
    items: items.map((program) => ({
      ...program,
      _count: { enrollments: enrollmentMap.get(program.id) ?? 0 },
      semesters: program.semesters.map((s) => ({ bundle: s.bundle })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getProgramBySlug(slug: string) {
  const db = getDb()
  const program = await db.query.programs.findFirst({
    where: eq(programs.slug, slug),
    with: {
      semesters: {
        with: {
          bundle: {
            with: { courses: { with: { course: true }, orderBy: (c, { asc: a }) => [a(c.position)] } },
          },
        },
        orderBy: (s, { asc: a }) => [a(s.number)],
      },
    },
  })
  if (!program) return null

  const enrollmentMap = await enrollmentCountsByProgram([program.id])
  const courseIds = program.semesters.flatMap((s) => s.bundle.courses.map((l) => l.course.id))
  const lessonMap = await lessonCounts(courseIds)

  return {
    ...program,
    _count: { enrollments: enrollmentMap.get(program.id) ?? 0 },
    semesters: program.semesters.map((semester) => ({
      ...semester,
      bundle: {
        ...semester.bundle,
        _count: { courses: semester.bundle.courses.length },
        courses: semester.bundle.courses.map((link) => ({
          course: {
            ...link.course,
            _count: { lessons: lessonMap.get(link.course.id) ?? 0 },
          },
        })),
      },
    })),
  }
}

export type ProgramWithSemesters = NonNullable<Awaited<ReturnType<typeof getProgramBySlug>>>

export async function getAdminPrograms() {
  const db = getDb()
  const rows = await db.query.programs.findMany({
    with: { semesters: { with: { bundle: true }, orderBy: (s, { asc: a }) => [a(s.number)] } },
    orderBy: (p, { desc: d }) => [d(p.updatedAt)],
  })
  const enrollmentMap = await enrollmentCountsByProgram(rows.map((p) => p.id))
  return rows.map((program) => ({
    ...program,
    _count: {
      enrollments: enrollmentMap.get(program.id) ?? 0,
      semesters: program.semesters.length,
    },
  }))
}

export async function getStudentPrograms(studentId: string) {
  const db = getDb()
  const rows = await db.query.programEnrollments.findMany({
    where: eq(programEnrollments.studentId, studentId),
    with: {
      program: {
        with: {
          semesters: {
            with: {
              bundle: {
                with: {
                  courses: { with: { course: true }, orderBy: (c, { asc: a }) => [a(c.position)] },
                },
              },
            },
            orderBy: (s, { asc: a }) => [a(s.number)],
          },
        },
      },
    },
    orderBy: (e, { desc: d }) => [d(e.updatedAt)],
  })

  const bundleIds = rows.flatMap((r) => r.program.semesters.map((s) => s.bundleId))
  const owned = bundleIds.length
    ? await db
        .select({
          bundleId: bundleEnrollments.bundleId,
          status: bundleEnrollments.status,
          expiresAt: bundleEnrollments.expiresAt,
        })
        .from(bundleEnrollments)
        .where(and(eq(bundleEnrollments.studentId, studentId), inArray(bundleEnrollments.bundleId, bundleIds)))
    : []
  const ownedMap = new Map(owned.map((item) => [item.bundleId, item]))

  return rows.map((enrollment) => {
    const semesters = enrollment.program.semesters.map((semester) => {
      const bundleEnrollment = ownedMap.get(semester.bundleId) ?? null
      return {
        ...semester,
        bundleEnrollment,
        owned: isEnrollmentActive(bundleEnrollment),
        bundle: {
          ...semester.bundle,
          _count: { courses: semester.bundle.courses.length },
          courses: semester.bundle.courses.map((link) => ({ course: link.course })),
        },
      }
    })
    const paid = semesters.filter((s) => s.owned).length
    return {
      enrollment,
      program: enrollment.program,
      semesters,
      paidSemesters: paid,
      totalSemesters: semesters.length,
      progress: percent(paid, semesters.length),
    }
  })
}

export type StudentProgramItem = Awaited<ReturnType<typeof getStudentPrograms>>[number]

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export async function getCourseAssignments(courseId: string) {
  const db = getDb()
  const [rows, subs] = await Promise.all([
    db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(asc(assignments.createdAt)),
    db
      .select({ assignmentId: assignmentSubmissions.assignmentId, status: assignmentSubmissions.status })
      .from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.courseId, courseId)),
  ])
  const map = new Map<string, { total: number; graded: number }>()
  for (const sub of subs) {
    const entry = map.get(sub.assignmentId) ?? { total: 0, graded: 0 }
    entry.total++
    if (sub.status === "GRADED") entry.graded++
    map.set(sub.assignmentId, entry)
  }
  return rows.map((assignment) => ({
    ...assignment,
    submissionCount: map.get(assignment.id)?.total ?? 0,
    gradedCount: map.get(assignment.id)?.graded ?? 0,
  }))
}

export type CourseAssignmentItem = Awaited<ReturnType<typeof getCourseAssignments>>[number]

export async function getAssignmentWithSubmissions(assignmentId: string) {
  const db = getDb()
  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1)
  if (!assignment) return null

  const [course] = await db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      instructorId: courses.instructorId,
    })
    .from(courses)
    .where(eq(courses.id, assignment.courseId))
    .limit(1)

  const rows = await db
    .select({
      submission: assignmentSubmissions,
      studentId: users.id,
      email: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(assignmentSubmissions)
    .innerJoin(users, eq(assignmentSubmissions.studentId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(assignmentSubmissions.assignmentId, assignmentId))
    .orderBy(desc(assignmentSubmissions.submittedAt))

  return {
    assignment,
    course,
    submissions: rows.map((row) => ({
      ...row.submission,
      student: {
        id: row.studentId,
        email: row.email,
        profile: { firstName: row.firstName, lastName: row.lastName, avatarUrl: row.avatarUrl },
      },
    })),
  }
}

export type AssignmentWithSubmissions = NonNullable<
  Awaited<ReturnType<typeof getAssignmentWithSubmissions>>
>

export async function getStudentCourseAssignments(studentId: string, courseId: string) {
  const db = getDb()
  const [rows, subs] = await Promise.all([
    db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(asc(assignments.createdAt)),
    db
      .select()
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.studentId, studentId),
          eq(assignmentSubmissions.courseId, courseId)
        )
      ),
  ])
  const map = new Map(subs.map((sub) => [sub.assignmentId, sub]))
  return rows.map((assignment) => ({ ...assignment, submission: map.get(assignment.id) ?? null }))
}

export type StudentAssignmentItem = Awaited<ReturnType<typeof getStudentCourseAssignments>>[number]

// Re-export commonly used order-item type for pages that need it.
export { orderItems }
