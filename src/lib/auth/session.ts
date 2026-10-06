import { SignJWT, jwtVerify } from "jose"

import type { Role } from "@/db/types"
import { env } from "@/lib/env"

export const SESSION_COOKIE = "lms_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const secretKey = new TextEncoder().encode(env.SESSION_SECRET)

export type SessionUser = {
  id: string
  email: string
  role: Role
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey)
}

/**
 * Verifies a session JWT. Safe to call from the Node.js proxy runtime because it
 * does not depend on `next/headers` or the database.
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] })
    const id = payload.sub
    const email = payload.email
    const role = payload.role
    if (typeof id !== "string" || typeof email !== "string" || typeof role !== "string") {
      return null
    }
    return { id, email, role: role as Role }
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  }
}
