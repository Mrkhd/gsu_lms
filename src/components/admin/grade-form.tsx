"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { RubricCriterion } from "@/db/types"
import { useActionForm } from "@/hooks/use-action-form"
import { gradeSubmissionAction } from "@/server/actions/assignments"

export function GradeForm({
  submissionId,
  maxPoints,
  rubric = [],
  defaultGrade,
  defaultFeedback,
  defaultScores,
}: {
  submissionId: string
  maxPoints: number
  rubric?: RubricCriterion[]
  defaultGrade: number | null
  defaultFeedback: string | null
  defaultScores?: Record<string, number> | null
}) {
  const { state, pending, onSubmit } = useActionForm(gradeSubmissionAction)
  const [scores, setScores] = React.useState<Record<string, number>>(() => defaultScores ?? {})
  const useRubric = rubric.length > 0
  const total = rubric.reduce((sum, criterion) => {
    const value = Number(scores[criterion.id] ?? 0)
    return sum + Math.min(criterion.points, Math.max(0, Number.isFinite(value) ? value : 0))
  }, 0)

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <FormError state={state} />

      {useRubric ? (
        <div className="space-y-2">
          <input type="hidden" name="grade" value={total} />
          <input type="hidden" name="rubricScores" value={JSON.stringify(scores)} />
          <div className="overflow-hidden rounded-lg border">
            {rubric.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0"
              >
                <span className="text-sm">{criterion.label}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={criterion.points}
                    step="0.5"
                    value={scores[criterion.id] ?? ""}
                    onChange={(event) =>
                      setScores((prev) => ({ ...prev, [criterion.id]: Number(event.target.value) }))
                    }
                    className="w-20"
                    aria-label={`${criterion.label} score`}
                  />
                  <span className="text-xs text-muted-foreground">/ {criterion.points}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Total: {total} / {rubric.reduce((sum, criterion) => sum + criterion.points, 0)}
            </span>
            <Button type="submit" size="sm" disabled={pending} className="ml-auto">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {defaultGrade === null ? "Save grade" : "Update grade"}
            </Button>
          </div>
        </div>
      ) : (
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
      )}

      <Textarea
        name="feedback"
        rows={2}
        defaultValue={defaultFeedback ?? ""}
        placeholder="Feedback for the student (optional)"
      />
    </form>
  )
}
