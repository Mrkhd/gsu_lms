import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session"
import { roleHome } from "@/lib/routes"

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/instructor", "/learn", "/checkout"]
const AUTH_ROUTES = ["/login", "/register"]

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Optimistic, cookie-only auth gate. Real authorization is always enforced
 * again server-side in pages and server actions (see `src/lib/auth/server.ts`).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (AUTH_ROUTES.includes(pathname) && session) {
    return NextResponse.redirect(new URL(roleHome(session.role), request.url))
  }

  if (!isProtected(pathname)) {
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (pathname.startsWith("/instructor") && session.role === "STUDENT") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
