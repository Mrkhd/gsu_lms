"use client"

import { useActionState } from "react"

import { FormError } from "@/components/form-error"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { idleState } from "@/lib/action-utils"
import { updateProfileAction } from "@/server/actions/auth"

export function ProfileForm({
  defaults,
}: {
  defaults: {
    firstName: string
    lastName: string
    headline: string
    bio: string
    avatarUrl: string
    email: string
  }
}) {
  const [state, action] = useActionState(updateProfileAction, idleState)

  return (
    <form action={action} className="max-w-2xl space-y-5">
      <FormError state={state} />
      {state.status === "success" ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={defaults.email} disabled readOnly />
        <p className="text-xs text-muted-foreground">Email addresses cannot be changed here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" defaultValue={defaults.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" defaultValue={defaults.lastName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={defaults.headline}
          placeholder="Full-stack developer & instructor"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input id="avatarUrl" name="avatarUrl" defaultValue={defaults.avatarUrl} placeholder="https://…" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={5} defaultValue={defaults.bio} />
      </div>

      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  )
}
