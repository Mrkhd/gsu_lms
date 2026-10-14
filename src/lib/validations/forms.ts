import { z } from "zod"

import { FORM_FIELD_TYPES } from "@/db/types"

export const formFieldSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(FORM_FIELD_TYPES),
    label: z.string().trim().min(1, "Field label is required").max(200),
    required: z.boolean().default(false),
    placeholder: z.string().trim().max(200).optional().or(z.literal("")),
    options: z.array(z.string().trim().min(1)).optional(),
  })
  .superRefine((field, ctx) => {
    if (["SELECT", "RADIO", "CHECKBOXES"].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one option",
          path: ["options"],
        })
      }
    }
  })

const fieldsField = z.preprocess((value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}, z.array(formFieldSchema).min(1, "Add at least one field"))

export const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  fields: fieldsField,
})

export const formSubmissionSchema = z.object({
  formId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.email("Enter a valid email address"),
})

export type FormInput = z.infer<typeof formSchema>
