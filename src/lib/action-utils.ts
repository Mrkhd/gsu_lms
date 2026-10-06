import { z } from "zod"

export type ActionState<T = undefined> =
  | { status: "idle" }
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }

export const idleState: ActionState = { status: "idle" }

export function success<T>(message: string, data?: T): ActionState<T> {
  return { status: "success", message, data }
}

export function failure(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionState {
  return { status: "error", message, fieldErrors }
}

export function fromZodError(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    if (!fieldErrors[key]) fieldErrors[key] = []
    fieldErrors[key].push(issue.message)
  }
  const first = error.issues[0]?.message ?? "Please check the form and try again."
  return { status: "error", message: first, fieldErrors }
}

/**
 * Converts FormData to a plain object. Repeated keys (checkbox groups) become
 * arrays so schema transforms can handle them uniformly.
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key in result) {
      const existing = result[key]
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    } else {
      result[key] = value
    }
  }
  return result
}

export function toArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String)
  return [String(value)]
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

/** Converts Prisma/network errors into a user-facing message without leaking internals. */
export function toActionError(error: unknown, fallback = "Something went wrong. Please try again."): ActionState {
  if (error instanceof Error) {
    if (error.message.includes("NEXT_REDIRECT")) throw error
    // Prisma unique constraint
    if ("code" in error && (error as { code?: string }).code === "P2002") {
      return failure("That value is already in use.")
    }
    if (error.message.includes("permission") || error.message.includes("signed in")) {
      return failure(error.message)
    }
  }
  return failure(fallback)
}
