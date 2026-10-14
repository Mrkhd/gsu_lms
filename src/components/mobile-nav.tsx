"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { roleHome } from "@/lib/routes"
import type { AccountMenuUser } from "@/components/account-menu"

const LINKS = [{ label: "Browse programs", href: "/programs" }]

export function MobileNav({ user }: { user: AccountMenuUser | null }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          {user ? (
            <Link
              href={roleHome(user.role)}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
