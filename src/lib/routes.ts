import type { Role } from "@/db/types"

export function roleHome(role: Role): string {
  if (role === "ADMIN") return "/admin"
  if (role === "INSTRUCTOR") return "/instructor"
  return "/dashboard"
}

export function roleLabel(role: Role): string {
  if (role === "ADMIN") return "Administrator"
  if (role === "INSTRUCTOR") return "Instructor"
  return "Student"
}
