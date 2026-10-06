import { z } from "zod"

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
})

export type ReviewInput = z.infer<typeof reviewSchema>
