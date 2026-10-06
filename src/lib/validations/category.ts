import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  description: z.string().trim().max(400).optional().or(z.literal("")),
})

export type CategoryInput = z.infer<typeof categorySchema>
