"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { and, eq, ne } from "drizzle-orm"

import { getDb } from "@/db/client"
import { formSubmissions, forms } from "@/db/schema"
import type { PublishStatus } from "@/db/types"
import { requireActionRole } from "@/lib/auth/server"
import { sendNotificationEmail } from "@/lib/email"
import { formSchema, formSubmissionSchema } from "@/lib/validations"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

export async function createFormAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireActionRole("ADMIN")
  const parsed = formSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { title, slug, description, status, fields } = parsed.data

  let createdId: string
  try {
    const db = getDb()
    const [existing] = await db.select({ id: forms.id }).from(forms).where(eq(forms.slug, slug)).limit(1)
    if (existing) return failure("That slug is already in use.", { slug: ["Slug already in use"] })

    const [created] = await db
      .insert(forms)
      .values({
        title,
        slug,
        description: description || null,
        status,
        fields,
        createdBy: admin.id,
      })
      .returning({ id: forms.id })
    createdId = created.id
    revalidatePath("/admin/forms")
  } catch (error) {
    return toActionError(error)
  }

  redirect(`/admin/forms/${createdId}`)
}

export async function updateFormAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const id = String(formData.get("id") ?? "")
  if (!id) return failure("Missing form id.")
  const parsed = formSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { title, slug, description, status, fields } = parsed.data

  try {
    const db = getDb()
    const [clash] = await db
      .select({ id: forms.id })
      .from(forms)
      .where(and(eq(forms.slug, slug), ne(forms.id, id)))
      .limit(1)
    if (clash) return failure("That slug is already in use.", { slug: ["Slug already in use"] })

    await db
      .update(forms)
      .set({ title, slug, description: description || null, status, fields, updatedAt: new Date() })
      .where(eq(forms.id, id))

    revalidatePath("/admin/forms")
    revalidatePath(`/admin/forms/${id}`)
    return success("Form saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteFormAction(id: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db.delete(forms).where(eq(forms.id, id))
    revalidatePath("/admin/forms")
  } catch (error) {
    return toActionError(error)
  }
  redirect("/admin/forms")
}

export async function setFormStatusAction(
  id: string,
  status: PublishStatus
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db.update(forms).set({ status, updatedAt: new Date() }).where(eq(forms.id, id))
    revalidatePath("/admin/forms")
    revalidatePath(`/admin/forms/${id}`)
    return success(status === "PUBLISHED" ? "Form published." : "Form updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function submitFormAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = formSubmissionSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const { formId, name, email } = parsed.data

  try {
    const db = getDb()
    const [form] = await db
      .select({ id: forms.id, title: forms.title, status: forms.status, fields: forms.fields })
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1)
    if (!form) return failure("Form not found.")
    if (form.status !== "PUBLISHED") return failure("This form is not accepting responses.")

    const answers: Record<string, unknown> = {}
    for (const field of form.fields) {
      if (field.type === "CHECKBOXES") {
        const values = formData
          .getAll(field.id)
          .map((value) => String(value))
          .filter(Boolean)
        if (field.required && values.length === 0) {
          return failure(`"${field.label}" is required.`)
        }
        answers[field.id] = values
      } else if (field.type === "CHECKBOX") {
        const value = formData.get(field.id) !== null
        if (field.required && !value) {
          return failure(`"${field.label}" is required.`)
        }
        answers[field.id] = value
      } else {
        const raw = formData.get(field.id)
        const value = typeof raw === "string" ? raw.trim() : ""
        if (field.required && !value) {
          return failure(`"${field.label}" is required.`)
        }
        if (field.type === "EMAIL" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
          return failure(`"${field.label}" must be a valid email address.`)
        }
        answers[field.id] = value
      }
    }

    await db.insert(formSubmissions).values({ formId, name, email, answers })
    await sendNotificationEmail(email, {
      title: "We received your response",
      body: `Thank you, ${name}. Your response to "${form.title}" has been recorded.`,
    })
    revalidatePath(`/admin/forms/${formId}`)
    return success("Your response has been submitted. Thank you!")
  } catch (error) {
    return toActionError(error)
  }
}
