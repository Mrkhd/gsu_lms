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
import { Textarea } from "@/components/ui/textarea"
import { useActionForm } from "@/hooks/use-action-form"
import { emailCourseStudentsAction } from "@/server/actions/email"

export function EmailStudentsDialog({
  courseId,
  trigger,
}: {
  courseId: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const { state, pending, onSubmit } = useActionForm(emailCourseStudentsAction, {
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email students</DialogTitle>
          <DialogDescription>
            Send an email to every student who currently has active access to this course.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <FormError state={state} />
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input id="email-subject" name="subject" required maxLength={200} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-message">Message</Label>
            <Textarea id="email-message" name="message" rows={8} required maxLength={5000} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Send email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
