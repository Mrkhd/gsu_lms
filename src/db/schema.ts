import { relations } from "drizzle-orm"
import {
  foreignKey,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

import type {
  CourseLevel,
  EnrollmentSource,
  EnrollmentStatus,
  LessonType,
  OrderItemType,
  OrderStatus,
  PublishStatus,
  ProgramLevel,
  Role,
  SubmissionStatus,
  ConversationType,
  FormField,
  UserStatus,
} from "./types"

const cuid = () => crypto.randomUUID()
const nowMs = () => new Date()
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs)
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(nowMs)
    .$onUpdateFn(nowMs)

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<Role>().notNull().default("STUDENT"),
    status: text("status").$type<UserStatus>().notNull().default("ACTIVE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_key").on(t.email)]
)

export const profiles = sqliteTable(
  "profiles",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    userId: text("user_id").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    headline: text("headline"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("profiles_user_id_key").on(t.userId),
    foreignKey({ columns: [t.userId], foreignColumns: [users.id], name: "profiles_user_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const courseCategories = sqliteTable(
  "course_categories",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("course_categories_slug_key").on(t.slug)]
)

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    level: text("level").$type<CourseLevel>().notNull().default("BEGINNER"),
    price: real("price").notNull().default(0),
    accessDurationDays: integer("access_duration_days"),
    status: text("status").$type<PublishStatus>().notNull().default("DRAFT"),
    whatYouLearn: text("what_you_learn", { mode: "json" }).$type<string[]>().notNull().default([]),
    requirements: text("requirements", { mode: "json" }).$type<string[]>().notNull().default([]),
    categoryId: text("category_id"),
    instructorId: text("instructor_id").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("courses_slug_key").on(t.slug),
    index("courses_status_idx").on(t.status),
    index("courses_category_id_idx").on(t.categoryId),
    index("courses_instructor_id_idx").on(t.instructorId),
    foreignKey({ columns: [t.categoryId], foreignColumns: [courseCategories.id], name: "courses_category_id_fkey" }).onDelete(
      "set null"
    ),
    foreignKey({ columns: [t.instructorId], foreignColumns: [users.id], name: "courses_instructor_id_fkey" }).onDelete(
      "restrict"
    ),
  ]
)

export const courseSections = sqliteTable(
  "course_sections",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("course_sections_course_id_position_idx").on(t.courseId, t.position),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "course_sections_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    courseId: text("course_id").notNull(),
    sectionId: text("section_id").notNull(),
    title: text("title").notNull(),
    type: text("type").$type<LessonType>().notNull().default("VIDEO"),
    videoUrl: text("video_url"),
    content: text("content"),
    pdfUrl: text("pdf_url"),
    durationMinutes: integer("duration_minutes"),
    position: integer("position").notNull().default(0),
    isPreview: integer("is_preview", { mode: "boolean" }).notNull().default(false),
    /** When set, students cannot open the lesson before this date. */
    availableAt: integer("available_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("lessons_course_id_position_idx").on(t.courseId, t.position),
    index("lessons_section_id_position_idx").on(t.sectionId, t.position),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "lessons_course_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.sectionId], foreignColumns: [courseSections.id], name: "lessons_section_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

export const bundles = sqliteTable(
  "bundles",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    price: real("price").notNull().default(0),
    accessDurationDays: integer("access_duration_days"),
    status: text("status").$type<PublishStatus>().notNull().default("DRAFT"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("bundles_slug_key").on(t.slug), index("bundles_status_idx").on(t.status)]
)

export const bundleCourses = sqliteTable(
  "bundle_courses",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    bundleId: text("bundle_id").notNull(),
    courseId: text("course_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    uniqueIndex("bundle_courses_bundle_id_course_id_key").on(t.bundleId, t.courseId),
    foreignKey({ columns: [t.bundleId], foreignColumns: [bundles.id], name: "bundle_courses_bundle_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "bundle_courses_course_id_fkey" }).onDelete(
      "restrict"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Commerce
// ---------------------------------------------------------------------------

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    number: integer("number").notNull(),
    studentId: text("student_id").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("PENDING"),
    subtotal: real("subtotal").notNull(),
    discount: real("discount").notNull().default(0),
    total: real("total").notNull(),
    currency: text("currency").notNull().default("USD"),
    provider: text("provider"),
    providerRef: text("provider_ref"),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_number_key").on(t.number),
    index("orders_student_id_idx").on(t.studentId),
    index("orders_status_idx").on(t.status),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "orders_student_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    orderId: text("order_id").notNull(),
    itemType: text("item_type").$type<OrderItemType>().notNull(),
    courseId: text("course_id"),
    bundleId: text("bundle_id"),
    title: text("title").notNull(),
    unitPrice: real("unit_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    totalPrice: real("total_price").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    foreignKey({ columns: [t.orderId], foreignColumns: [orders.id], name: "order_items_order_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "order_items_course_id_fkey" }).onDelete(
      "set null"
    ),
    foreignKey({ columns: [t.bundleId], foreignColumns: [bundles.id], name: "order_items_bundle_id_fkey" }).onDelete(
      "set null"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Enrollment + access
// ---------------------------------------------------------------------------

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    courseId: text("course_id").notNull(),
    bundleId: text("bundle_id"),
    source: text("source").$type<EnrollmentSource>().notNull().default("DIRECT_PURCHASE"),
    sourceId: text("source_id"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    status: text("status").$type<EnrollmentStatus>().notNull().default("ACTIVE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("enrollments_student_id_course_id_key").on(t.studentId, t.courseId),
    index("enrollments_student_id_idx").on(t.studentId),
    index("enrollments_course_id_idx").on(t.courseId),
    index("enrollments_expires_at_idx").on(t.expiresAt),
    index("enrollments_status_idx").on(t.status),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "enrollments_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "enrollments_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const bundleEnrollments = sqliteTable(
  "bundle_enrollments",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    bundleId: text("bundle_id").notNull(),
    source: text("source").$type<EnrollmentSource>().notNull().default("BUNDLE_PURCHASE"),
    sourceId: text("source_id"),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    status: text("status").$type<EnrollmentStatus>().notNull().default("ACTIVE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("bundle_enrollments_student_id_bundle_id_key").on(t.studentId, t.bundleId),
    index("bundle_enrollments_student_id_idx").on(t.studentId),
    index("bundle_enrollments_bundle_id_idx").on(t.bundleId),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "bundle_enrollments_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.bundleId], foreignColumns: [bundles.id], name: "bundle_enrollments_bundle_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const courseLocks = sqliteTable(
  "course_locks",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    courseId: text("course_id").notNull(),
    lockedBy: text("locked_by"),
    reason: text("reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("course_locks_student_id_course_id_key").on(t.studentId, t.courseId),
    index("course_locks_student_id_idx").on(t.studentId),
    index("course_locks_course_id_idx").on(t.courseId),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "course_locks_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "course_locks_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Learning
// ---------------------------------------------------------------------------

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    courseId: text("course_id").notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    lastViewedAt: integer("last_viewed_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("lesson_progress_student_id_lesson_id_key").on(t.studentId, t.lessonId),
    index("lesson_progress_student_id_course_id_idx").on(t.studentId, t.courseId),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "lesson_progress_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.lessonId], foreignColumns: [lessons.id], name: "lesson_progress_lesson_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "lesson_progress_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    courseId: text("course_id").notNull(),
    rating: integer("rating").notNull().default(5),
    comment: text("comment"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("reviews_student_id_course_id_key").on(t.studentId, t.courseId),
    index("reviews_course_id_idx").on(t.courseId),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "reviews_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "reviews_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    url: text("url"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("notifications_user_id_read_idx").on(t.userId, t.read),
    foreignKey({ columns: [t.userId], foreignColumns: [users.id], name: "notifications_user_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// University: programs + per-semester enrollment
// ---------------------------------------------------------------------------

export const programs = sqliteTable(
  "programs",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    code: text("code"),
    shortDescription: text("short_description"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    level: text("level").$type<ProgramLevel>().notNull().default("Bachelor"),
    semesterCount: integer("semester_count").notNull().default(4),
    accessDurationDays: integer("access_duration_days").default(120),
    status: text("status").$type<PublishStatus>().notNull().default("DRAFT"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("programs_slug_key").on(t.slug), index("programs_status_idx").on(t.status)]
)

export const programSemesters = sqliteTable(
  "program_semesters",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    programId: text("program_id").notNull(),
    bundleId: text("bundle_id").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("program_semesters_program_id_number_key").on(t.programId, t.number),
    uniqueIndex("program_semesters_program_id_bundle_id_key").on(t.programId, t.bundleId),
    index("program_semesters_bundle_id_idx").on(t.bundleId),
    foreignKey({ columns: [t.programId], foreignColumns: [programs.id], name: "program_semesters_program_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.bundleId], foreignColumns: [bundles.id], name: "program_semesters_bundle_id_fkey" }).onDelete(
      "restrict"
    ),
  ]
)

export const programEnrollments = sqliteTable(
  "program_enrollments",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    studentId: text("student_id").notNull(),
    programId: text("program_id").notNull(),
    status: text("status").$type<EnrollmentStatus>().notNull().default("ACTIVE"),
    currentSemester: integer("current_semester").notNull().default(1),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("program_enrollments_student_id_program_id_key").on(t.studentId, t.programId),
    index("program_enrollments_student_id_idx").on(t.studentId),
    index("program_enrollments_program_id_idx").on(t.programId),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "program_enrollments_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.programId], foreignColumns: [programs.id], name: "program_enrollments_program_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export const assignments = sqliteTable(
  "assignments",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    courseId: text("course_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: integer("due_at", { mode: "timestamp_ms" }),
    /** When set, students cannot open or submit the assignment before this date. */
    availableAt: integer("available_at", { mode: "timestamp_ms" }),
    maxPoints: integer("max_points").notNull().default(100),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("assignments_course_id_idx").on(t.courseId),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "assignments_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const assignmentSubmissions = sqliteTable(
  "assignment_submissions",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    assignmentId: text("assignment_id").notNull(),
    studentId: text("student_id").notNull(),
    courseId: text("course_id").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull().$defaultFn(nowMs),
    status: text("status").$type<SubmissionStatus>().notNull().default("SUBMITTED"),
    grade: real("grade"),
    feedback: text("feedback"),
    gradedAt: integer("graded_at", { mode: "timestamp_ms" }),
    gradedById: text("graded_by_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("assignment_submissions_assignment_student_key").on(t.assignmentId, t.studentId),
    index("assignment_submissions_assignment_id_idx").on(t.assignmentId),
    index("assignment_submissions_student_id_idx").on(t.studentId),
    foreignKey({ columns: [t.assignmentId], foreignColumns: [assignments.id], name: "assignment_submissions_assignment_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.studentId], foreignColumns: [users.id], name: "assignment_submissions_student_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "assignment_submissions_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Course communication
// ---------------------------------------------------------------------------

export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    type: text("type").$type<ConversationType>().notNull(),
    courseId: text("course_id").notNull(),
    /** DIRECT only: the participating student */
    studentId: text("student_id"),
    /** DIRECT only: the course instructor */
    instructorId: text("instructor_id"),
    lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("conversations_course_id_type_idx").on(t.courseId, t.type),
    index("conversations_student_id_idx").on(t.studentId),
    foreignKey({ columns: [t.courseId], foreignColumns: [courses.id], name: "conversations_course_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    conversationId: text("conversation_id").notNull(),
    senderId: text("sender_id").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_conversation_id_created_at_idx").on(t.conversationId, t.createdAt),
    foreignKey({ columns: [t.conversationId], foreignColumns: [conversations.id], name: "messages_conversation_id_fkey" }).onDelete(
      "cascade"
    ),
    foreignKey({ columns: [t.senderId], foreignColumns: [users.id], name: "messages_sender_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Forms (admin-built, public submissions)
// ---------------------------------------------------------------------------

export const forms = sqliteTable(
  "forms",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: text("status").$type<PublishStatus>().notNull().default("DRAFT"),
    fields: text("fields", { mode: "json" }).$type<FormField[]>().notNull().default([]),
    createdBy: text("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("forms_slug_key").on(t.slug),
    index("forms_status_idx").on(t.status),
    foreignKey({ columns: [t.createdBy], foreignColumns: [users.id], name: "forms_created_by_fkey" }).onDelete(
      "set null"
    ),
  ]
)

export const formSubmissions = sqliteTable(
  "form_submissions",
  {
    id: text("id").primaryKey().$defaultFn(cuid),
    formId: text("form_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    answers: text("answers", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index("form_submissions_form_id_idx").on(t.formId),
    foreignKey({ columns: [t.formId], foreignColumns: [forms.id], name: "form_submissions_form_id_fkey" }).onDelete(
      "cascade"
    ),
  ]
)

// ---------------------------------------------------------------------------
// Relations (for db.query.*)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  instructorCourses: many(courses),
  enrollments: many(enrollments),
  bundleEnrollments: many(bundleEnrollments),
  programEnrollments: many(programEnrollments),
  lessonProgress: many(lessonProgress),
  orders: many(orders),
  reviews: many(reviews),
  notifications: many(notifications),
  assignmentSubmissions: many(assignmentSubmissions),
  messages: many(messages),
}))

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}))

export const courseCategoriesRelations = relations(courseCategories, ({ many }) => ({
  courses: many(courses),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(courseCategories, {
    fields: [courses.categoryId],
    references: [courseCategories.id],
  }),
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  sections: many(courseSections),
  lessons: many(lessons),
  bundleLinks: many(bundleCourses),
  enrollments: many(enrollments),
  orderItems: many(orderItems),
  reviews: many(reviews),
  lessonProgress: many(lessonProgress),
  assignments: many(assignments),
  conversations: many(conversations),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  course: one(courses, { fields: [conversations.courseId], references: [courses.id] }),
  student: one(users, { fields: [conversations.studentId], references: [users.id] }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}))

export const courseSectionsRelations = relations(courseSections, ({ one, many }) => ({
  course: one(courses, { fields: [courseSections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  section: one(courseSections, { fields: [lessons.sectionId], references: [courseSections.id] }),
  progress: many(lessonProgress),
}))

export const bundlesRelations = relations(bundles, ({ many }) => ({
  courses: many(bundleCourses),
  enrollments: many(bundleEnrollments),
  orderItems: many(orderItems),
  programSemesters: many(programSemesters),
}))

export const bundleCoursesRelations = relations(bundleCourses, ({ one }) => ({
  bundle: one(bundles, { fields: [bundleCourses.bundleId], references: [bundles.id] }),
  course: one(courses, { fields: [bundleCourses.courseId], references: [courses.id] }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  student: one(users, { fields: [orders.studentId], references: [users.id] }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  course: one(courses, { fields: [orderItems.courseId], references: [courses.id] }),
  bundle: one(bundles, { fields: [orderItems.bundleId], references: [bundles.id] }),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}))

export const bundleEnrollmentsRelations = relations(bundleEnrollments, ({ one }) => ({
  student: one(users, { fields: [bundleEnrollments.studentId], references: [users.id] }),
  bundle: one(bundles, { fields: [bundleEnrollments.bundleId], references: [bundles.id] }),
}))

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  student: one(users, { fields: [lessonProgress.studentId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  course: one(courses, { fields: [lessonProgress.courseId], references: [courses.id] }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  student: one(users, { fields: [reviews.studentId], references: [users.id] }),
  course: one(courses, { fields: [reviews.courseId], references: [courses.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  submissions: many(assignmentSubmissions),
}))

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, { fields: [assignmentSubmissions.studentId], references: [users.id] }),
  course: one(courses, { fields: [assignmentSubmissions.courseId], references: [courses.id] }),
}))

export const programsRelations = relations(programs, ({ many }) => ({
  semesters: many(programSemesters),
  enrollments: many(programEnrollments),
}))

export const programSemestersRelations = relations(programSemesters, ({ one }) => ({
  program: one(programs, { fields: [programSemesters.programId], references: [programs.id] }),
  bundle: one(bundles, { fields: [programSemesters.bundleId], references: [bundles.id] }),
}))

export const programEnrollmentsRelations = relations(programEnrollments, ({ one }) => ({
  student: one(users, { fields: [programEnrollments.studentId], references: [users.id] }),
  program: one(programs, { fields: [programEnrollments.programId], references: [programs.id] }),
}))
