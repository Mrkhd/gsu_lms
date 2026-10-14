import Link from "next/link"

import { AccountMenu } from "@/components/account-menu"
import { DashboardSidebar, MobileDashboardNav, type DashboardVariant } from "@/components/dashboard-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import type { CurrentUser } from "@/lib/auth/server"
import { roleLabel } from "@/lib/routes"

export function DashboardShell({
  user,
  variant,
  children,
}: {
  user: CurrentUser
  variant: DashboardVariant
  children: React.ReactNode
}) {
  const menuUser = {
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  }

  return (
    <div className="flex min-h-svh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-background lg:block">
        <DashboardSidebar variant={variant} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <MobileDashboardNav variant={variant} />
          <span className="text-sm font-medium text-muted-foreground">{roleLabel(user.role)}</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/">View site</Link>
            </Button>
            <AccountMenu user={menuUser} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
