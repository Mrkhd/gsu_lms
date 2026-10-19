"use client"

import Link from "next/link"
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { AssignmentDialog } from "@/components/admin/assignment-dialog"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatShortDate } from "@/lib/format"
import type { CourseAssignmentItem } from "@/lib/queries"
import { deleteAssignmentAction } from "@/server/actions/assignments"

export function AssignmentsManager({
  courseId,
  basePath,
  assignments,
}: {
  courseId: string
  basePath: string
  assignments: CourseAssignmentItem[]
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Assignments</h2>
          <p className="text-sm text-muted-foreground">
            Create assignments and grade students&apos; PDF submissions.
          </p>
        </div>
        <AssignmentDialog
          courseId={courseId}
          trigger={
            <Button size="sm">
              <Plus />
              New assignment
            </Button>
          }
        />
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const ungraded = assignment.submissionCount - assignment.gradedCount
            return (
              <div
                key={assignment.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.availableAt ? `Opens ${formatShortDate(assignment.availableAt)} · ` : ""}
                    {assignment.dueAt ? `Due ${formatShortDate(assignment.dueAt)} · ` : ""}
                    {assignment.maxPoints} points · {assignment.submissionCount} submitted
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {ungraded > 0 ? (
                    <Badge variant="destructive">{ungraded} to grade</Badge>
                  ) : assignment.submissionCount > 0 ? (
                    <Badge variant="secondary">All graded</Badge>
                  ) : (
                    <Badge variant="outline">No submissions</Badge>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${basePath}/courses/${courseId}/assignments/${assignment.id}`}>
                      Grade
                    </Link>
                  </Button>
                  <AssignmentDialog
                    courseId={courseId}
                    assignment={{
                      id: assignment.id,
                      title: assignment.title,
                      description: assignment.description,
                      dueAt: assignment.dueAt,
                      availableAt: assignment.availableAt,
                      maxPoints: assignment.maxPoints,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Edit assignment">
                        <Pencil />
                      </Button>
                    }
                  />
                  <ActionButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete assignment"
                    className="text-destructive"
                    action={deleteAssignmentAction.bind(null, assignment.id)}
                    confirm={{
                      title: "Delete this assignment?",
                      description: "All student submissions will be removed.",
                      confirmLabel: "Delete",
                    }}
                  >
                    <Trash2 />
                  </ActionButton>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Create your first assignment for students to submit."
        />
      )}
    </div>
  )
}
