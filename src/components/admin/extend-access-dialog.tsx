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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { useActionForm } from "@/hooks/use-action-form"
import { extendCourseEnrollmentAction } from "@/server/actions/enrollments"

export function ExtendAccessDialog({
  enrollmentId,
  trigger,
}: {
  enrollmentId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [preset, setPreset] = React.useState("180")
  const [customDays, setCustomDays] = React.useState("")
  const { state, pending, onSubmit } = useActionForm(extendCourseEnrollmentAction, {
    onSuccess: () => setOpen(false),
  })

  const duration = customDays.trim() ? customDays.trim() : preset

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend course access</DialogTitle>
          <DialogDescription>
            Set a new expiry from today and reactivate the enrollment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="enrollmentId" value={enrollmentId} />
          <input type="hidden" name="accessDurationDays" value={duration} />
          <FormError state={state} />

          <div className="space-y-2">
            <Label>Preset duration</Label>
            <Select
              value={preset}
              onValueChange={(value) => {
                setPreset(value)
                setCustomDays("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_DURATION_PRESETS.map((option) => (
                  <SelectItem
                    key={option.label}
                    value={option.days === null ? "lifetime" : String(option.days)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-days">Or enter days</Label>
            <Input
              id="custom-days"
              type="number"
              min={1}
              max={3650}
              placeholder="e.g. 14"
              value={customDays}
              onChange={(event) => setCustomDays(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Overrides the preset. Leave empty to use the preset duration.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Extend access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
