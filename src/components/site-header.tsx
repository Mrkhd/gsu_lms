import Link from "next/link"

import { AccountMenu } from "@/components/account-menu"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/server"
import { APP_NAME } from "@/lib/constants"

const LINKS = [
  { label: "Programs", href: "/programs" },
  { label: "Courses", href: "/courses" },
  { label: "Bundles", href: "/bundles" },
]

export async function SiteHeader() {
  const user = await getCurrentUser()
  const menuUser = user
    ? {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      }
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#3a0b0b]/95 text-red-50 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <MobileNav user={menuUser} />
        <Link href="/" className="font-heading text-lg font-semibold text-red-50">
          {APP_NAME}
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className="text-red-100 hover:bg-white/10 hover:text-white"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {menuUser ? (
            <AccountMenu user={menuUser} />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden text-red-100 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 text-[#3a0b0b] hover:bg-amber-400">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
