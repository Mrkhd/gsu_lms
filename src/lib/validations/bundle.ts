import { z } from "zod"

import { accessDurationField, courseStatusEnum } from "./course"

export const bundleSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
  slug: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  shortDescription: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  thumbnailUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  accessDurationDays: accessDurationField,
  status: courseStatusEnum.default("DRAFT"),
  courseIds: z
    .union([z.array(z.string().min(1)), z.string().min(1)])
    .transform((value) => (Array.isArray(value) ? value : [value]).filter(Boolean))
    .refine((value) => value.length > 0, { message: "Select at least one course" }),
})

export type BundleInput = z.infer<typeof bundleSchema>
