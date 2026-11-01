"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

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
  rubric: { id: string; label: string; points: number }[]
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
  const [rubric, setRubric] = React.useState(assignment?.rubric ?? [])
  const updateCriterion = (id: string, patch: Partial<{ label: string; points: number }>) =>
    setRubric((prev) => prev.map((criterion) => (criterion.id === id ? { ...criterion, ...patch } : criterion)))
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
          <input type="hidden" name="rubric" value={JSON.stringify(rubric)} />
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
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label>Rubric (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRubric((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), label: "", points: 10 },
                  ])
                }
              >
                <Plus />
                Add criterion
              </Button>
            </div>
            {rubric.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add criteria to grade with a rubric. Leave empty for a single grade.
              </p>
            ) : (
              <div className="space-y-2">
                {rubric.map((criterion, index) => (
                  <div key={criterion.id} className="flex items-center gap-2">
                    <Input
                      value={criterion.label}
                      onChange={(event) =>
                        updateCriterion(criterion.id, { label: event.target.value })
                      }
                      placeholder={`Criterion ${index + 1}`}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      value={criterion.points}
                      onChange={(event) =>
                        updateCriterion(criterion.id, { points: Number(event.target.value) })
                      }
                      className="w-24"
                      aria-label="Points"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRubric((prev) => prev.filter((item) => item.id !== criterion.id))
                      }
                      aria-label="Remove criterion"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Rubric total: {rubric.reduce((sum, criterion) => sum + criterion.points, 0)} points
                </p>
              </div>
            )}
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
