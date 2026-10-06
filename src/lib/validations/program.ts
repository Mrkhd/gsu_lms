import { z } from "zod"

import { accessDurationField, courseStatusEnum } from "./course"

export const programLevelEnum = z.enum(["Certificate", "Diploma", "Bachelor", "Master"])

export const programSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
  slug: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  code: z
    .string()
    .trim()
    .max(24)
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
  level: programLevelEnum.default("Bachelor"),
  semesterCount: z.coerce.number().int().min(1).max(12).default(4),
  accessDurationDays: accessDurationField,
  status: courseStatusEnum.default("DRAFT"),
})

export type ProgramInput = z.infer<typeof programSchema>
