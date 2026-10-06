import Link from "next/link"

import { APP_NAME } from "@/lib/constants"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/programs" className="hover:text-foreground">
            Programs
          </Link>
          <Link href="/courses" className="hover:text-foreground">
            Courses
          </Link>
          <Link href="/bundles" className="hover:text-foreground">
            Bundles
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  )
}
