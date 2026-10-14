import Image from "next/image"
import Link from "next/link"

import { AccountMenu } from "@/components/account-menu"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth/server"
import { APP_NAME } from "@/lib/constants"

const LINKS = [{ label: "Programs", href: "/programs" }]

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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <MobileNav user={menuUser} />
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Image
            src="/logo.png"
            alt={`${APP_NAME} logo`}
            width={32}
            height={32}
            className="size-8 rounded-md object-contain"
            unoptimized
            priority
          />
          <span className="truncate">{APP_NAME}</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((link) => (
            <Button key={link.href} asChild variant="ghost" size="sm">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {menuUser ? (
            <AccountMenu user={menuUser} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
