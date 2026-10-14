import { z } from "zod"

export const courseStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
export const courseLevelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
export const lessonTypeEnum = z.enum(["VIDEO", "TEXT", "PDF"])

/**
 * Accepts "lifetime" or a positive number of days and normalises to
 * `number | null` (null = lifetime access).
 */
export const accessDurationField = z
  .union([z.literal("lifetime"), z.literal(""), z.coerce.number().int().min(1).max(3650)])
  .default("lifetime")
  .transform((value) => (value === "lifetime" || value === "" ? null : Number(value)))

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined))

const stringList = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean)
    return value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
  })

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
  slug: optionalText,
  shortDescription: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  thumbnailUrl: optionalText,
  categoryId: optionalText,
  instructorId: optionalText,
  level: courseLevelEnum.default("BEGINNER"),
  accessDurationDays: accessDurationField,
  status: courseStatusEnum.default("DRAFT"),
  whatYouLearn: stringList,
  requirements: stringList,
})

export const sectionSchema = z.object({
  title: z.string().trim().min(1, "Section title is required").max(160),
})

export const lessonSchema = z
  .object({
    title: z.string().trim().min(1, "Lesson title is required").max(200),
    type: lessonTypeEnum.default("VIDEO"),
    videoUrl: optionalText,
    content: z.string().optional().or(z.literal("")),
    pdfUrl: optionalText,
    durationMinutes: z
      .union([z.literal(""), z.coerce.number().int().min(0).max(10_000)])
      .optional()
      .transform((value) => (value === "" || value === undefined ? null : Number(value))),
    isPreview: z
      .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
      .optional()
      .transform((value) => value === true || value === "true" || value === "on"),
  })
  .refine((data) => data.type !== "VIDEO" || !!data.videoUrl, {
    message: "A video URL is required for video lessons",
    path: ["videoUrl"],
  })
  .refine((data) => data.type !== "PDF" || !!data.pdfUrl, {
    message: "A PDF URL is required for PDF lessons",
    path: ["pdfUrl"],
  })

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
})

export type CourseInput = z.infer<typeof courseSchema>
export type SectionInput = z.infer<typeof sectionSchema>
export type LessonInput = z.infer<typeof lessonSchema>
