"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import {
  bundleCourses,
  bundleEnrollments,
  bundles,
  orderItems,
  programSemesters,
} from "@/db/schema"
import type { PublishStatus } from "@/db/types"
import { requireActionRole } from "@/lib/auth/server"
import { bundleSchema } from "@/lib/validations"
import { uniqueBundleSlug } from "@/lib/slugs"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

function refreshBundle(bundleId: string, slug: string) {
  revalidatePath("/admin/bundles")
  revalidatePath(`/admin/bundles/${bundleId}`)
  revalidatePath("/bundles")
  revalidatePath(`/bundles/${slug}`)
}

export async function createBundleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = bundleSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  let bundleId = ""
  try {
    const db = getDb()
    const slug = await uniqueBundleSlug(data.title, data.slug)
    const [bundle] = await db
      .insert(bundles)
      .values({
        title: data.title,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        accessDurationDays: data.accessDurationDays,
        status: data.status,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      })
      .returning()
    await db.insert(bundleCourses).values(
      data.courseIds.map((courseId, index) => ({
        bundleId: bundle.id,
        courseId,
        position: index,
      }))
    )
    bundleId = bundle.id
    refreshBundle(bundle.id, bundle.slug)
  } catch (error) {
    return toActionError(error)
  }
  redirect(`/admin/bundles/${bundleId}`)
}

export async function updateBundleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const bundleId = String(formData.get("bundleId") ?? "")
  const parsed = bundleSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  try {
    const db = getDb()
    const [existing] = await db
      .select({ id: bundles.id, publishedAt: bundles.publishedAt })
      .from(bundles)
      .where(eq(bundles.id, bundleId))
      .limit(1)
    if (!existing) return failure("Bundle not found.")

    const slug = await uniqueBundleSlug(data.title, data.slug, bundleId)
    await db
      .update(bundles)
      .set({
        title: data.title,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        accessDurationDays: data.accessDurationDays,
        status: data.status,
        publishedAt:
          data.status === "PUBLISHED"
            ? new Date()
            : data.status === "DRAFT"
              ? null
              : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(bundles.id, bundleId))

    await db.delete(bundleCourses).where(eq(bundleCourses.bundleId, bundleId))
    if (data.courseIds.length > 0) {
      await db.insert(bundleCourses).values(
        data.courseIds.map((courseId, index) => ({ bundleId, courseId, position: index }))
      )
    }

    refreshBundle(bundleId, slug)
    return success("Bundle saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function setBundleStatusAction(
  bundleId: string,
  status: PublishStatus
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    const [bundle] = await db
      .update(bundles)
      .set({ status, publishedAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() })
      .where(eq(bundles.id, bundleId))
      .returning()
    refreshBundle(bundle.id, bundle.slug)
    return success(status === "PUBLISHED" ? "Bundle published." : "Bundle updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteBundleAction(bundleId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    const [bundle] = await db
      .select({ id: bundles.id, slug: bundles.slug })
      .from(bundles)
      .where(eq(bundles.id, bundleId))
      .limit(1)
    if (!bundle) return failure("Bundle not found.")

    await db.delete(programSemesters).where(eq(programSemesters.bundleId, bundle.id))
    await db.update(orderItems).set({ bundleId: null }).where(eq(orderItems.bundleId, bundle.id))
    await db.delete(bundleEnrollments).where(eq(bundleEnrollments.bundleId, bundle.id))
    await db.delete(bundleCourses).where(eq(bundleCourses.bundleId, bundle.id))
    await db.delete(bundles).where(eq(bundles.id, bundle.id))
    refreshBundle(bundle.id, bundle.slug)
    return success("Bundle deleted.")
  } catch (error) {
    return toActionError(error)
  }
}
