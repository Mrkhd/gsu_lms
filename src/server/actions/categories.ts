"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { courseCategories } from "@/db/schema"
import { requireActionRole } from "@/lib/auth/server"
import { categorySchema } from "@/lib/validations"
import { uniqueCategorySlug } from "@/lib/slugs"
import {
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function refreshCategories() {
  revalidatePath("/admin/categories")
  revalidatePath("/courses")
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = categorySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  try {
    const db = getDb()
    const slug = await uniqueCategorySlug(parsed.data.name, parsed.data.slug)
    await db.insert(courseCategories).values({
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
    })
    refreshCategories()
    return success("Category created.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function updateCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const categoryId = String(formData.get("categoryId") ?? "")
  const parsed = categorySchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  try {
    const db = getDb()
    const slug = await uniqueCategorySlug(parsed.data.name, parsed.data.slug, categoryId)
    await db
      .update(courseCategories)
      .set({
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(courseCategories.id, categoryId))
    refreshCategories()
    return success("Category updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    await db.delete(courseCategories).where(eq(courseCategories.id, categoryId))
    refreshCategories()
    return success("Category deleted.")
  } catch (error) {
    return toActionError(error)
  }
}
