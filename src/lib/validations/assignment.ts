import { z } from "zod"

export const assignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  dueAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }),
  availableAt: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }),
  maxPoints: z.coerce.number().int().min(1, "Max points must be at least 1").max(1000).default(100),
  rubric: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        if (!value.trim()) return []
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value ?? []
    },
    z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().trim().min(1, "Criterion label is required").max(200),
          points: z.coerce.number().min(0).max(1000),
        })
      )
      .default([])
  ),
})

export const gradeSchema = z.object({
  submissionId: z.string().min(1),
  grade: z.coerce.number().min(0, "Grade cannot be negative").max(1000),
  feedback: z.string().trim().max(5000).optional().or(z.literal("")),
  rubricScores: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        if (!value.trim()) return {}
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }
      return value ?? {}
    },
    z.record(z.string(), z.coerce.number().min(0)).optional()
  ),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>
export type GradeInput = z.infer<typeof gradeSchema>
