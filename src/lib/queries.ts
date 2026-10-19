import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  assignmentSubmissions,
  assignments,
  bundleCourses,
  bundleEnrollments,
  bundles,
  courseCategories,
  courseLocks,
  courses,
  enrollments,
  formSubmissions,
  forms,
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
import type { EnrollmentStatus, PublishStatus, UserStatus } from "@/db/types"
import { getCourseLocks, isEnrollmentActive } from "@/lib/access"
import { percent } from "@/lib/format"

export const PAGE_SIZE = 9

export type CatalogSort = "newest" | "popular"

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

export async function getProgramOptions() {
  const db = getDb()
  return db
    .select({ id: programs.id, title: programs.title, slug: programs.slug })
    .from(programs)
    .where(eq(programs.status, "PUBLISHED"))
    .orderBy(asc(programs.title))
}

export async function getProgramsWithSemesters() {
  const db = getDb()
  const rows = await db
    .select({
      programId: programs.id,
      programTitle: programs.title,
      semesterId: bundles.id,
      semesterTitle: bundles.title,
      semesterNumber: programSemesters.number,
    })
    .from(programs)
    .leftJoin(programSemesters, eq(programSemesters.programId, programs.id))
    .leftJoin(bundles, eq(programSemesters.bundleId, bundles.id))
    .orderBy(asc(programs.title), asc(programSemesters.number))

  const map = new Map<
    string,
    { id: string; title: string; semesters: { id: string; title: string; number: number | null }[] }
  >()
  for (const row of rows) {
    if (!map.has(row.programId)) {
      map.set(row.programId, { id: row.programId, title: row.programTitle, semesters: [] })
    }
    if (row.semesterId) {
      map.get(row.programId)!.semesters.push({
        id: row.semesterId,
        title: row.semesterTitle ?? "",
        number: row.semesterNumber ?? null,
      })
    }
  }
  return [...map.values()]
}

export type ProgramWithSemesterOptions = Awaited<ReturnType<typeof getProgramsWithSemesters>>[number]

async function courseIdsForProgram(programSlug: string) {
  const db = getDb()
  const [program] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.slug, programSlug))
    .limit(1)
  if (!program) return []
  const rows = await db
    .selectDistinct({ courseId: bundleCourses.courseId })
    .from(programSemesters)
    .innerJoin(bundleCourses, eq(programSemesters.bundleId, bundleCourses.bundleId))
    .where(eq(programSemesters.programId, program.id))
  return rows.map((row) => row.courseId)
}

async function bundleIdsForProgram(programSlug: string) {
  const db = getDb()
  const [program] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.slug, programSlug))
    .limit(1)
  if (!program) return []
  const rows = await db
    .select({ bundleId: programSemesters.bundleId })
    .from(programSemesters)
    .where(eq(programSemesters.programId, program.id))
  return rows.map((row) => row.bundleId)
}

export async function getCategories(options: { search?: string } = {}) {
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
    .where(options.search ? like(courseCategories.name, `%${options.search}%`) : undefined)
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
  programSlug?: string
  sort?: CatalogSort
  page?: number
  pageSize?: number
}) {
  const {
    search,
    categorySlug,
    programSlug,
    sort = "newest",
    page = 1,
    pageSize = PAGE_SIZE,
  } = options
  const db = getDb()

  let programCourseIds: string[] | null = null
  if (programSlug) {
    programCourseIds = await courseIdsForProgram(programSlug)
    if (programCourseIds.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 1 }
    }
  }

  const where = and(
    eq(courses.status, "PUBLISHED"),
    search
      ? or(like(courses.title, `%${search}%`), like(courses.shortDescription, `%${search}%`))
      : undefined,
    categorySlug ? eq(courseCategories.slug, categorySlug) : undefined,
    programCourseIds ? inArray(courses.id, programCourseIds) : undefined
  )

  const popular = sql<number>`(select count(*) from "enrollments" where "enrollments"."course_id" = "courses"."id")`
  const orderBy =
    sort === "popular"
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

  const [lessonMap, reviewMap] = await Promise.all([
    lessonCounts([course.id]),
    reviewCounts([course.id]),
  ])
  return {
    ...course,
    _count: {
      lessons: lessonMap.get(course.id) ?? 0,
      reviews: reviewMap.get(course.id) ?? 0,
    },
  }
}

export async function getPublishedBundles(options: {
  search?: string
  programSlug?: string
  page?: number
  pageSize?: number
}) {
  const { search, programSlug, page = 1, pageSize = PAGE_SIZE } = options
  const db = getDb()

  let programBundleIds: string[] | null = null
  if (programSlug) {
    programBundleIds = await bundleIdsForProgram(programSlug)
    if (programBundleIds.length === 0) {
      return { items: [], total: 0, page, pageSize, totalPages: 1 }
    }
  }

  const where = and(
    eq(bundles.status, "PUBLISHED"),
    search ? or(like(bundles.title, `%${search}%`), like(bundles.shortDescription, `%${search}%`)) : undefined,
    programBundleIds ? inArray(bundles.id, programBundleIds) : undefined
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
  const locks = await getCourseLocks(studentId)

  return rows.map((enrollment) => {
    const total = lessonMap.get(enrollment.courseId) ?? 0
    const completed = completedMap.get(enrollment.courseId) ?? 0
    return {
      enrollment,
      course: { ...enrollment.course, _count: { lessons: total } },
      locked: locks.has(enrollment.courseId),
      completed,
      total,
      progress: percent(completed, total),
    }
  })
}

export type StudentCourseItem = Awaited<ReturnType<typeof getStudentCourses>>[number]

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
  const locks = await getCourseLocks(studentId)
  return rows.map((row) => ({
    ...row,
    bundle: {
      ...row.bundle,
      _count: { courses: row.bundle.courses.length },
      courses: row.bundle.courses.map((link) => ({
        course: link.course,
        locked: locks.has(link.course.id),
      })),
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

export async function getInstructorCourses(
  instructorId: string,
  isAdmin = false,
  options: { search?: string; status?: PublishStatus } = {}
) {
  const db = getDb()
  const where = and(
    isAdmin ? undefined : eq(courses.instructorId, instructorId),
    options.status ? eq(courses.status, options.status) : undefined,
    options.search ? like(courses.title, `%${options.search}%`) : undefined
  )
  const rows = await db.query.courses.findMany({
    where,
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

export async function getCourseStudents(
  courseId: string,
  options: { search?: string; status?: EnrollmentStatus } = {}
) {
  const db = getDb()

  let studentIds: string[] | null = null
  if (options.search) {
    const matches = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(
        or(
          like(users.email, `%${options.search}%`),
          like(profiles.firstName, `%${options.search}%`),
          like(profiles.lastName, `%${options.search}%`)
        )
      )
    if (matches.length === 0) return []
    studentIds = matches.map((m) => m.id)
  }

  const rows = await db.query.enrollments.findMany({
    where: and(
      eq(enrollments.courseId, courseId),
      options.status ? eq(enrollments.status, options.status) : undefined,
      studentIds ? inArray(enrollments.studentId, studentIds) : undefined
    ),
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

export async function getAdminBundles(
  options: { search?: string; status?: PublishStatus } = {}
) {
  const db = getDb()
  const rows = await db.query.bundles.findMany({
    where: and(
      options.status ? eq(bundles.status, options.status) : undefined,
      options.search ? like(bundles.title, `%${options.search}%`) : undefined
    ),
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

export async function getInstructors(options: { search?: string; status?: UserStatus } = {}) {
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
    .where(
      and(
        eq(users.role, "INSTRUCTOR"),
        options.status ? eq(users.status, options.status) : undefined,
        options.search
          ? or(
              like(users.email, `%${options.search}%`),
              like(profiles.firstName, `%${options.search}%`),
              like(profiles.lastName, `%${options.search}%`)
            )
          : undefined
      )
    )
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
  return rows.map(({ courseCount, ...instructor }) => ({
    ...instructor,
    _count: { instructorCourses: Number(courseCount) },
  }))
}

export async function getStudents(options: { search?: string; status?: UserStatus } = {}) {
  const db = getDb()
  const where = and(
    eq(users.role, "STUDENT"),
    options.status ? eq(users.status, options.status) : undefined,
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

export async function getAdminSemesterEnrollments(
  options: { search?: string; status?: EnrollmentStatus } = {}
) {
  const db = getDb()
  const where = and(
    options.status ? eq(bundleEnrollments.status, options.status) : undefined,
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
      enrollment: bundleEnrollments,
      studentId: users.id,
      studentEmail: users.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
      bundleId: bundles.id,
      bundleTitle: bundles.title,
      bundleSlug: bundles.slug,
    })
    .from(bundleEnrollments)
    .innerJoin(users, eq(bundleEnrollments.studentId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .innerJoin(bundles, eq(bundleEnrollments.bundleId, bundles.id))
    .where(where)
    .orderBy(desc(bundleEnrollments.createdAt))
    .limit(200)
  return rows.map((row) => ({
    ...row.enrollment,
    student: {
      id: row.studentId,
      email: row.studentEmail,
      profile: { firstName: row.firstName, lastName: row.lastName, avatarUrl: row.avatarUrl },
    },
    bundle: { id: row.bundleId, title: row.bundleTitle, slug: row.bundleSlug },
  }))
}

export type AdminSemesterEnrollment = Awaited<
  ReturnType<typeof getAdminSemesterEnrollments>
>[number]

export async function getStudentAccessDetail(studentId: string) {
  const db = getDb()
  const [student] = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      createdAt: users.createdAt,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, studentId))
    .limit(1)
  if (!student) return null

  const [programRows, semesterRows, lockRows] = await Promise.all([
    db
      .select({
        status: programEnrollments.status,
        currentSemester: programEnrollments.currentSemester,
        program: programs,
      })
      .from(programEnrollments)
      .innerJoin(programs, eq(programEnrollments.programId, programs.id))
      .where(eq(programEnrollments.studentId, studentId))
      .orderBy(desc(programEnrollments.updatedAt)),
    db
      .select({ enrollment: bundleEnrollments, bundle: bundles })
      .from(bundleEnrollments)
      .innerJoin(bundles, eq(bundleEnrollments.bundleId, bundles.id))
      .where(eq(bundleEnrollments.studentId, studentId))
      .orderBy(desc(bundleEnrollments.updatedAt)),
    db
      .select({ courseId: courseLocks.courseId, reason: courseLocks.reason })
      .from(courseLocks)
      .where(eq(courseLocks.studentId, studentId)),
  ])

  const bundleIds = semesterRows.map((row) => row.bundle.id)
  const [courseRows, programSemesterRows] = await Promise.all([
    bundleIds.length
      ? db
          .select({ bundleId: bundleCourses.bundleId, course: courses })
          .from(bundleCourses)
          .innerJoin(courses, eq(bundleCourses.courseId, courses.id))
          .where(inArray(bundleCourses.bundleId, bundleIds))
          .orderBy(asc(bundleCourses.position))
      : Promise.resolve([] as { bundleId: string; course: typeof courses.$inferSelect }[]),
    bundleIds.length
      ? db
          .select({
            bundleId: programSemesters.bundleId,
            number: programSemesters.number,
            programTitle: programs.title,
          })
          .from(programSemesters)
          .innerJoin(programs, eq(programSemesters.programId, programs.id))
          .where(inArray(programSemesters.bundleId, bundleIds))
      : Promise.resolve([] as { bundleId: string; number: number; programTitle: string }[]),
  ])

  const lockSet = new Set(lockRows.map((row) => row.courseId))
  const enrolledCourseIds = new Set(courseRows.map((row) => row.course.id))

  const extraLockedIds = lockRows
    .map((row) => row.courseId)
    .filter((id) => !enrolledCourseIds.has(id))
  const extraLockedCourses = extraLockedIds.length
    ? await db
        .select({ id: courses.id, title: courses.title, slug: courses.slug })
        .from(courses)
        .where(inArray(courses.id, extraLockedIds))
    : []

  const semesters = semesterRows.map(({ enrollment, bundle }) => {
    const mapping = programSemesterRows.find((row) => row.bundleId === bundle.id)
    const semesterCourses = courseRows
      .filter((row) => row.bundleId === bundle.id)
      .map((row) => ({
        id: row.course.id,
        title: row.course.title,
        slug: row.course.slug,
        locked: lockSet.has(row.course.id),
      }))
    return {
      enrollment,
      bundle: { id: bundle.id, title: bundle.title },
      programTitle: mapping?.programTitle ?? null,
      semesterNumber: mapping?.number ?? null,
      courses: semesterCourses,
    }
  })

  return {
    student,
    programs: programRows.map((row) => ({
      status: row.status,
      currentSemester: row.currentSemester,
      title: row.program.title,
    })),
    semesters,
    lockedOnly: extraLockedCourses.map((course) => ({ ...course, locked: true })),
  }
}

export type StudentAccessDetail = NonNullable<Awaited<ReturnType<typeof getStudentAccessDetail>>>

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
  const total = Number(totalRows[0]?.value ?? 0)
  return {
    items: items.map((program) => ({
      ...program,
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

  const courseIds = program.semesters.flatMap((s) => s.bundle.courses.map((l) => l.course.id))
  const lessonMap = await lessonCounts(courseIds)

  return {
    ...program,
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

export async function getAdminPrograms(
  options: { search?: string; status?: PublishStatus } = {}
) {
  const db = getDb()
  const rows = await db.query.programs.findMany({
    where: and(
      options.status ? eq(programs.status, options.status) : undefined,
      options.search
        ? or(
            like(programs.title, `%${options.search}%`),
            like(programs.code, `%${options.search}%`)
          )
        : undefined
    ),
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
  const now = Date.now()
  return rows.map((assignment) => {
    const locked = assignment.availableAt ? assignment.availableAt.getTime() > now : false
    return {
      ...assignment,
      // Do not send locked instructions/submissions to the browser before release.
      description: locked ? null : assignment.description,
      locked,
      submission: locked ? null : map.get(assignment.id) ?? null,
    }
  })
}

export type StudentAssignmentItem = Awaited<ReturnType<typeof getStudentCourseAssignments>>[number]

// Re-export commonly used order-item type for pages that need it.
export { orderItems }

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export async function getAdminForms(options: { search?: string; status?: PublishStatus } = {}) {
  const db = getDb()
  const rows = await db
    .select({
      id: forms.id,
      title: forms.title,
      slug: forms.slug,
      status: forms.status,
      fields: forms.fields,
      createdAt: forms.createdAt,
      updatedAt: forms.updatedAt,
      responseCount: sql<number>`(select count(*) from ${formSubmissions} where ${formSubmissions.formId} = ${forms.id})`,
    })
    .from(forms)
    .where(
      and(
        options.status ? eq(forms.status, options.status) : undefined,
        options.search ? like(forms.title, `%${options.search}%`) : undefined
      )
    )
    .orderBy(desc(forms.updatedAt))
  return rows.map(({ responseCount, ...form }) => ({
    ...form,
    _count: { responses: Number(responseCount), fields: form.fields.length },
  }))
}

export type AdminFormListItem = Awaited<ReturnType<typeof getAdminForms>>[number]

export async function getFormById(id: string) {
  const db = getDb()
  const [row] = await db.select().from(forms).where(eq(forms.id, id)).limit(1)
  return row ?? null
}

export async function getFormBySlug(slug: string) {
  const db = getDb()
  const [row] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.slug, slug), eq(forms.status, "PUBLISHED")))
    .limit(1)
  return row ?? null
}

export async function getPublishedForms() {
  const db = getDb()
  return db
    .select({
      id: forms.id,
      title: forms.title,
      slug: forms.slug,
      description: forms.description,
      updatedAt: forms.updatedAt,
    })
    .from(forms)
    .where(eq(forms.status, "PUBLISHED"))
    .orderBy(desc(forms.updatedAt))
}

export async function getFormSubmissions(formId: string) {
  const db = getDb()
  return db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.formId, formId))
    .orderBy(desc(formSubmissions.createdAt))
}

export type FormSubmissionRow = Awaited<ReturnType<typeof getFormSubmissions>>[number]
