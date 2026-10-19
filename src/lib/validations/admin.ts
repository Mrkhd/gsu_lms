import { z } from "zod"

import { accessDurationField } from "./course"

export const roleEnum = z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"])
export const userStatusEnum = z.enum(["ACTIVE", "SUSPENDED"])
export const enrollmentStatusEnum = z.enum(["ACTIVE", "EXPIRED", "CANCELLED"])
export const enrollmentSourceEnum = z.enum(["DIRECT_PURCHASE", "BUNDLE_PURCHASE", "ADMIN_GRANT"])

export const grantEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  programId: z.string().min(1, "Select a program"),
  bundleId: z.string().min(1, "Select a semester"),
  accessDurationDays: accessDurationField,
})

export const updateSemesterEnrollmentSchema = z.object({
  status: enrollmentStatusEnum,
  accessDurationDays: accessDurationField,
})

export const emailStudentsSchema = z.object({
  courseId: z.string().min(1),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
})

export const emailStudentSchema = z.object({
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(5000),
})

export const grantCourseLockSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
})

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusEnum,
  accessDurationDays: accessDurationField,
})

export const updateUserRoleSchema = z.object({
  role: roleEnum,
})

export const updateUserStatusSchema = z.object({
  status: userStatusEnum,
})

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
  role: roleEnum,
})

export type GrantEnrollmentInput = z.infer<typeof grantEnrollmentSchema>
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>
