"use client"

import { useActionState } from "react"
import { CheckCircle2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { SubmitButton } from "@/components/submit-button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { idleState } from "@/lib/action-utils"
import { submitReviewAction } from "@/server/actions/reviews"

export function ReviewForm({ courseId, existing }: { courseId: string; existing: boolean }) {
  const [state, action] = useActionState(submitReviewAction, idleState)

  if (state.status === "success") {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-4" />
        {state.message}
      </p>
    )
  }

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4">
      <input type="hidden" name="courseId" value={courseId} />
      <FormError state={state} />
      <div className="space-y-2">
        <Label htmlFor="rating">Rating</Label>
        <Select name="rating" defaultValue="5">
          <SelectTrigger id="rating" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 4, 3, 2, 1].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} {value === 1 ? "star" : "stars"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Your review</Label>
        <Textarea id="comment" name="comment" rows={3} placeholder="Share your experience…" />
      </div>
      <SubmitButton size="sm">{existing ? "Update review" : "Submit review"}</SubmitButton>
    </form>
  )
}
