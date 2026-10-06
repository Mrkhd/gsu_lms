"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { programEnrollments, programSemesters, programs } from "@/db/schema"
import type { PublishStatus } from "@/db/types"
import { requireActionRole } from "@/lib/auth/server"
import { programSchema } from "@/lib/validations"
import { uniqueProgramSlug } from "@/lib/slugs"
import {
  failure,
  formDataToObject,
  fromZodError,
  success,
  toActionError,
  type ActionState,
} from "@/lib/action-utils"

type SemesterMapping = { number: number; bundleId: string; title: string }

function parseSemesters(formData: FormData, count: number): SemesterMapping[] {
  const seen = new Set<string>()
  const mappings: SemesterMapping[] = []
  for (let n = 1; n <= count; n++) {
    const bundleId = String(formData.get(`semester_${n}_bundleId`) ?? "").trim()
    const title = String(formData.get(`semester_${n}_title`) ?? "").trim()
    if (!bundleId || seen.has(bundleId)) continue
    seen.add(bundleId)
    mappings.push({ number: n, bundleId, title: title || `Semester ${n}` })
  }
  return mappings
}

function refreshProgram(id: string, slug: string) {
  revalidatePath("/admin/programs")
  revalidatePath(`/admin/programs/${id}`)
  revalidatePath("/programs")
  revalidatePath(`/programs/${slug}`)
  revalidatePath("/dashboard/program")
}

export async function createProgramAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const parsed = programSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  let programId = ""
  try {
    const db = getDb()
    const slug = await uniqueProgramSlug(data.title, data.slug)
    const [program] = await db
      .insert(programs)
      .values({
        title: data.title,
        slug,
        code: data.code ?? null,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        level: data.level,
        semesterCount: data.semesterCount,
        accessDurationDays: data.accessDurationDays,
        status: data.status,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      })
      .returning()

    const semesters = parseSemesters(formData, data.semesterCount)
    if (semesters.length > 0) {
      await db
        .insert(programSemesters)
        .values(semesters.map((semester) => ({ programId: program.id, ...semester })))
    }

    programId = program.id
    refreshProgram(program.id, program.slug)
  } catch (error) {
    return toActionError(error)
  }
  redirect(`/admin/programs/${programId}`)
}

export async function updateProgramAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("ADMIN")
  const programId = String(formData.get("programId") ?? "")
  const parsed = programSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) return fromZodError(parsed.error)
  const data = parsed.data

  try {
    const db = getDb()
    const [existing] = await db
      .select({ id: programs.id, publishedAt: programs.publishedAt })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1)
    if (!existing) return failure("Program not found.")

    const slug = await uniqueProgramSlug(data.title, data.slug, programId)
    const semesters = parseSemesters(formData, data.semesterCount)

    await db
      .update(programs)
      .set({
        title: data.title,
        slug,
        code: data.code ?? null,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        level: data.level,
        semesterCount: data.semesterCount,
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
      .where(eq(programs.id, programId))

    await db.delete(programSemesters).where(eq(programSemesters.programId, programId))
    if (semesters.length > 0) {
      await db
        .insert(programSemesters)
        .values(semesters.map((semester) => ({ programId, ...semester })))
    }

    refreshProgram(programId, slug)
    return success("Program saved.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function setProgramStatusAction(
  programId: string,
  status: PublishStatus
): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    const [program] = await db
      .update(programs)
      .set({ status, publishedAt: status === "PUBLISHED" ? new Date() : null, updatedAt: new Date() })
      .where(eq(programs.id, programId))
      .returning()
    refreshProgram(program.id, program.slug)
    return success(status === "PUBLISHED" ? "Program published." : "Program updated.")
  } catch (error) {
    return toActionError(error)
  }
}

export async function deleteProgramAction(programId: string): Promise<ActionState> {
  try {
    await requireActionRole("ADMIN")
    const db = getDb()
    const [program] = await db
      .select({ id: programs.id, slug: programs.slug })
      .from(programs)
      .where(eq(programs.id, programId))
      .limit(1)
    if (!program) return failure("Program not found.")
    await db.delete(programEnrollments).where(eq(programEnrollments.programId, program.id))
    await db.delete(programSemesters).where(eq(programSemesters.programId, program.id))
    await db.delete(programs).where(eq(programs.id, program.id))
    refreshProgram(program.id, program.slug)
    return success("Program deleted.")
  } catch (error) {
    return toActionError(error)
  }
}
