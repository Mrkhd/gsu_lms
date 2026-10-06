"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionForm } from "@/hooks/use-action-form"
import { createUserAction } from "@/server/actions/users"

export function UserCreateDialog({
  role,
  label,
  trigger,
}: {
  role: "STUDENT" | "INSTRUCTOR"
  label: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const { state, pending, onSubmit } = useActionForm(createUserAction, {
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            The account is created with the {role.toLowerCase()} role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="role" value={role} />
          <FormError state={state} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-first">First name</Label>
              <Input id="user-first" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-last">Last name</Label>
              <Input id="user-last" name="lastName" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-password">Temporary password</Label>
            <Input id="user-password" name="password" type="text" minLength={8} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
