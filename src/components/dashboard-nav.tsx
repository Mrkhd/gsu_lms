"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ADMIN_NAV, APP_NAME, INSTRUCTOR_NAV, STUDENT_NAV } from "@/lib/constants"
import { cn } from "@/lib/utils"

export type DashboardVariant = "admin" | "instructor" | "student"

const CONFIG = {
  admin: { sections: ADMIN_NAV, root: "/admin" },
  instructor: { sections: INSTRUCTOR_NAV, root: "/instructor" },
  student: { sections: STUDENT_NAV, root: "/dashboard" },
} as const

export function DashboardSidebar({
  variant,
  onNavigate,
}: {
  variant: DashboardVariant
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { sections, root } = CONFIG[variant]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="font-heading text-base font-semibold">
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {sections.map((section, index) => (
          <div key={section.label ?? index} className="space-y-1">
            {section.label ? (
              <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {section.label}
              </p>
            ) : null}
            {section.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href || (item.href !== root && pathname.startsWith(`${item.href}/`))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}

export function MobileDashboardNav({ variant }: { variant: DashboardVariant }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <DashboardSidebar variant={variant} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
