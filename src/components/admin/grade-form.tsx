"use client"

import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useActionForm } from "@/hooks/use-action-form"
import { gradeSubmissionAction } from "@/server/actions/assignments"

export function GradeForm({
  submissionId,
  maxPoints,
  defaultGrade,
  defaultFeedback,
}: {
  submissionId: string
  maxPoints: number
  defaultGrade: number | null
  defaultFeedback: string | null
}) {
  const { state, pending, onSubmit } = useActionForm(gradeSubmissionAction)

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <FormError state={state} />
      <div className="flex items-center gap-2">
        <Input
          name="grade"
          type="number"
          min={0}
          max={maxPoints}
          step="0.5"
          defaultValue={defaultGrade ?? ""}
          placeholder="Grade"
          className="w-24"
          required
        />
        <span className="text-sm text-muted-foreground">/ {maxPoints}</span>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {defaultGrade === null ? "Save grade" : "Update grade"}
        </Button>
      </div>
      <Textarea
        name="feedback"
        rows={2}
        defaultValue={defaultFeedback ?? ""}
        placeholder="Feedback for the student (optional)"
      />
    </form>
  )
}
