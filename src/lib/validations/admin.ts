import { z } from "zod"

import { accessDurationField } from "./course"

export const roleEnum = z.enum(["ADMIN", "INSTRUCTOR", "STUDENT"])
export const userStatusEnum = z.enum(["ACTIVE", "SUSPENDED"])
export const enrollmentStatusEnum = z.enum(["ACTIVE", "EXPIRED", "CANCELLED"])
export const enrollmentSourceEnum = z.enum(["DIRECT_PURCHASE", "BUNDLE_PURCHASE", "ADMIN_GRANT"])

export const grantEnrollmentSchema = z
  .object({
    studentId: z.string().min(1, "Select a student"),
    courseId: z.string().optional().or(z.literal("")),
    bundleId: z.string().optional().or(z.literal("")),
    accessDurationDays: accessDurationField,
  })
  .refine((data) => !!data.courseId || !!data.bundleId, {
    message: "Choose a course or a bundle",
    path: ["courseId"],
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
