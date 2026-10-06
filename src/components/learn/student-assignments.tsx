"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, ExternalLink, FileText, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { idleState } from "@/lib/action-utils"
import type { StudentAssignmentItem } from "@/lib/queries"
import { submitAssignmentAction } from "@/server/actions/assignments"

function SubmitForm({
  assignmentId,
  hasSubmission,
}: {
  assignmentId: string
  hasSubmission: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.set("assignmentId", assignmentId)
    formData.set("file", file)
    startTransition(async () => {
      const result = await submitAssignmentAction(idleState, formData)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      }
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={onChange}
      />
      <Button
        type="button"
        size="sm"
        variant={hasSubmission ? "outline" : "default"}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload />}
        {pending ? "Uploading…" : hasSubmission ? "Replace PDF" : "Upload PDF"}
      </Button>
    </>
  )
}

export function StudentAssignments({ assignments }: { assignments: StudentAssignmentItem[] }) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No assignments have been set for this course.</p>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const submission = assignment.submission
        const graded = submission?.status === "GRADED"
        return (
          <Card key={assignment.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{assignment.title}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span>{assignment.maxPoints} points</span>
                    {assignment.dueAt ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        Due {formatDate(assignment.dueAt)}
                      </span>
                    ) : null}
                  </p>
                </div>
                {graded ? (
                  <Badge variant="default">
                    <CheckCircle2 className="size-3" />
                    Graded
                  </Badge>
                ) : submission ? (
                  <Badge variant="secondary">Submitted</Badge>
                ) : (
                  <Badge variant="outline">Not submitted</Badge>
                )}
              </div>

              {assignment.description ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {assignment.description}
                </p>
              ) : null}

              {graded ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Grade: {submission.grade} / {assignment.maxPoints}
                  </p>
                  {submission.feedback ? (
                    <p className="mt-1 text-muted-foreground">{submission.feedback}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {submission ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={`/media/${submission.fileKey}`} target="_blank" rel="noreferrer">
                      <FileText />
                      View my PDF
                    </a>
                  </Button>
                ) : null}
                <SubmitForm assignmentId={assignment.id} hasSubmission={Boolean(submission)} />
                {submission ? (
                  <span className="text-xs text-muted-foreground">
                    Submitted {formatDate(submission.submittedAt)}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
