"use client"

import { useActionState } from "react"

import { FormError } from "@/components/form-error"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { idleState } from "@/lib/action-utils"
import { changePasswordAction } from "@/server/actions/auth"

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, idleState)

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormError state={state} />
      {state.status === "success" ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Use at least 8 characters. You will stay signed in on this device.
      </p>

      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  )
}
