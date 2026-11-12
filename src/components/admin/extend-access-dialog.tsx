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
  const { state, pending, onSubmit } = useActionForm(extendCourseEnrollmentAction, {
    onSuccess: () => setOpen(false),
  })

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
          <FormError state={state} />
          <div className="space-y-2">
            <Label>New access duration</Label>
            <Select name="accessDurationDays" defaultValue="180">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_DURATION_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.label}
                    value={preset.days === null ? "lifetime" : String(preset.days)}
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
