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
import { emailCourseStudentAction } from "@/server/actions/email"

export function EmailStudentDialog({
  courseId,
  studentId,
  studentName,
  trigger,
}: {
  courseId: string
  studentId: string
  studentName: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const { state, pending, onSubmit } = useActionForm(emailCourseStudentAction, {
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email {studentName}</DialogTitle>
          <DialogDescription>
            This sends directly to the student from your instructor address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="studentId" value={studentId} />
          <FormError state={state} />
          <div className="space-y-2">
            <Label htmlFor={`student-subject-${studentId}`}>Subject</Label>
            <Input
              id={`student-subject-${studentId}`}
              name="subject"
              required
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`student-message-${studentId}`}>Message</Label>
            <Textarea
              id={`student-message-${studentId}`}
              name="message"
              rows={8}
              required
              maxLength={5000}
            />
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
