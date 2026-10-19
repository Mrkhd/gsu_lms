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
import { createSectionAction, updateSectionAction } from "@/server/actions/courses"

function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function SectionDialog({
  courseId,
  section,
  trigger,
}: {
  courseId: string
  section?: { id: string; title: string; availableAt?: Date | string | null }
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [availableAt, setAvailableAt] = React.useState(toLocalInput(section?.availableAt))
  const { state, pending, onSubmit } = useActionForm(
    section ? updateSectionAction : createSectionAction,
    { onSuccess: () => setOpen(false) }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? "Rename section" : "Add section"}</DialogTitle>
          <DialogDescription>
            Sections group your lessons. Optionally release the whole section at once.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input
            type="hidden"
            name="availableAt"
            value={availableAt ? new Date(availableAt).toISOString() : ""}
          />
          {section ? <input type="hidden" name="sectionId" value={section.id} /> : null}
          <FormError state={state} />
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              name="title"
              defaultValue={section?.title}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section-available">Release date (optional)</Label>
            <Input
              id="section-available"
              type="datetime-local"
              value={availableAt}
              onChange={(event) => setAvailableAt(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Students can see the section but cannot open its lessons until this date.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {section ? "Save" : "Add section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
