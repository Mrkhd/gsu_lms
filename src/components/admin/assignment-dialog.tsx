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
import { createAssignmentAction, updateAssignmentAction } from "@/server/actions/assignments"

type AssignmentDefaults = {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  availableAt: Date | string | null
  maxPoints: number
}

function toDateInput(value: Date | null) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function AssignmentDialog({
  courseId,
  assignment,
  trigger,
}: {
  courseId: string
  assignment?: AssignmentDefaults
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [availableAt, setAvailableAt] = React.useState(toLocalInput(assignment?.availableAt))
  const { state, pending, onSubmit } = useActionForm(
    assignment ? updateAssignmentAction : createAssignmentAction,
    { onSuccess: () => setOpen(false) }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit assignment" : "New assignment"}</DialogTitle>
          <DialogDescription>
            Students upload their completed work as a PDF, then you grade it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input
            type="hidden"
            name="availableAt"
            value={availableAt ? new Date(availableAt).toISOString() : ""}
          />
          {assignment ? <input type="hidden" name="assignmentId" value={assignment.id} /> : null}
          <FormError state={state} />
          <div className="space-y-2">
            <Label htmlFor="assignment-title">Title</Label>
            <Input id="assignment-title" name="title" defaultValue={assignment?.title} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-description">Instructions</Label>
            <Textarea
              id="assignment-description"
              name="description"
              rows={4}
              defaultValue={assignment?.description ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-due">Due date</Label>
              <Input
                id="assignment-due"
                name="dueAt"
                type="date"
                defaultValue={toDateInput(assignment?.dueAt ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-points">Max points</Label>
              <Input
                id="assignment-points"
                name="maxPoints"
                type="number"
                min={1}
                max={1000}
                defaultValue={assignment?.maxPoints ?? 100}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignment-available">Release date (optional)</Label>
            <Input
              id="assignment-available"
              type="datetime-local"
              value={availableAt}
              onChange={(event) => setAvailableAt(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Students can see the assignment but cannot open or submit it until this date.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {assignment ? "Save assignment" : "Create assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
