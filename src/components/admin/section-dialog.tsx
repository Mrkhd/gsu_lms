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

export function SectionDialog({
  courseId,
  section,
  trigger,
}: {
  courseId: string
  section?: { id: string; title: string }
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
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
            Sections group your lessons into a clear structure.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
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
