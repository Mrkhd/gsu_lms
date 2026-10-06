// String unions replacing Prisma enums (SQLite/D1 has no native enums).
export const ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const
export type Role = (typeof ROLES)[number]

export const USER_STATUSES = ["ACTIVE", "SUSPENDED"] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const PUBLISH_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const
export type PublishStatus = (typeof PUBLISH_STATUSES)[number]

export const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const
export type CourseLevel = (typeof COURSE_LEVELS)[number]

export const LESSON_TYPES = ["VIDEO", "TEXT", "PDF"] as const
export type LessonType = (typeof LESSON_TYPES)[number]

export const ORDER_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_ITEM_TYPES = ["COURSE", "BUNDLE"] as const
export type OrderItemType = (typeof ORDER_ITEM_TYPES)[number]

export const ENROLLMENT_SOURCES = ["DIRECT_PURCHASE", "BUNDLE_PURCHASE", "ADMIN_GRANT"] as const
export type EnrollmentSource = (typeof ENROLLMENT_SOURCES)[number]

export const ENROLLMENT_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number]

export const PROGRAM_LEVELS = ["Certificate", "Diploma", "Bachelor", "Master"] as const
export type ProgramLevel = (typeof PROGRAM_LEVELS)[number]

export const SUBMISSION_STATUSES = ["SUBMITTED", "GRADED"] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]
