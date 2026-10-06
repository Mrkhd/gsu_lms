"use client"

import Link from "next/link"
import type { Role } from "@/db/types"
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { roleHome, roleLabel } from "@/lib/routes"
import { initials } from "@/lib/format"
import { logoutAction } from "@/server/actions/auth"

export type AccountMenuUser = {
  email: string
  role: Role
  firstName: string | null
  lastName: string | null
}

export function AccountMenu({ user }: { user: AccountMenuUser }) {
  const home = roleHome(user.role)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback>{initials(user.firstName, user.lastName, user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate font-medium">
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || "Account"}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            <span className="mt-1 text-xs text-muted-foreground">{roleLabel(user.role)}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={home}>
            <LayoutDashboard />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <User />
            Profile
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
