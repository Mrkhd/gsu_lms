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
  maxPoints: z.coerce.number().int().min(1, "Max points must be at least 1").max(1000).default(100),
})

export const gradeSchema = z.object({
  submissionId: z.string().min(1),
  grade: z.coerce.number().min(0, "Grade cannot be negative").max(1000),
  feedback: z.string().trim().max(5000).optional().or(z.literal("")),
})

export type AssignmentInput = z.infer<typeof assignmentSchema>
export type GradeInput = z.infer<typeof gradeSchema>
