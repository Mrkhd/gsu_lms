export type NumericLike =
  | number
  | string
  | { toNumber(): number }
  | null
  | undefined

export function toNumber(value: NumericLike): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber()
  }
  return 0
}

export function formatCurrency(
  value: NumericLike,
  currency = "USD",
  options?: Intl.NumberFormatOptions
): string {
  const amount = toNumber(value)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    ...options,
  }).format(amount)
}

export function formatPrice(value: NumericLike): string {
  const amount = toNumber(value)
  if (amount <= 0) return "Free"
  return formatCurrency(amount)
}

export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", options).format(new Date(date))
}

export function formatShortDate(date: Date | string | null | undefined): string {
  return formatDate(date, { year: "numeric", month: "short", day: "numeric" })
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const DAY_MS = 1000 * 60 * 60 * 24

export function daysRemaining(expiresAt: Date | string | null | undefined): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / DAY_MS))
}

export function isExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}

/** Human label for a course/bundle access window. `null` days means lifetime. */
export function formatAccessDuration(days: number | null | undefined): string {
  if (days === null || days === undefined) return "Lifetime access"
  if (days <= 0) return "Lifetime access"
  if (days % 365 === 0) {
    const years = days / 365
    return `${years} ${years === 1 ? "year" : "years"} access`
  }
  if (days % 30 === 0) {
    const months = days / 30
    return `${months} ${months === 1 ? "month" : "months"} access`
  }
  return `${days} ${days === 1 ? "day" : "days"} access`
}

export function percent(completed: number, total: number): number {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function initials(...parts: (string | null | undefined)[]): string {
  const value = parts.filter(Boolean).join(" ").trim()
  if (!value) return "U"
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function fullName(
  profile?: { firstName?: string | null; lastName?: string | null } | null,
  fallback = "User"
): string {
  if (!profile) return fallback
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim()
  return name || fallback
}

export function formatOrderNumber(number: number | null | undefined): string {
  if (number === null || number === undefined) return "#—"
  return `#${String(number).padStart(5, "0")}`
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return ""
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
