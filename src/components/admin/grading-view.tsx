import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { GradeForm } from "@/components/admin/grade-form"
import { PageHeader } from "@/components/dashboard-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate, fullName, initials } from "@/lib/format"
import type { AssignmentWithSubmissions } from "@/lib/queries"

export function GradingView({
  data,
  basePath,
}: {
  data: AssignmentWithSubmissions
  basePath: "/admin" | "/instructor"
}) {
  const { assignment, course, submissions } = data
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`${basePath}/courses/${assignment.courseId}`}>
          <ArrowLeft />
          Back to course
        </Link>
      </Button>

      <PageHeader
        title={assignment.title}
        description={`${course?.title ?? "Course"} · ${assignment.maxPoints} points${
          assignment.dueAt ? ` · due ${formatDate(assignment.dueAt)}` : ""
        }`}
      />

      {assignment.description ? (
        <p className="whitespace-pre-line text-sm text-muted-foreground">{assignment.description}</p>
      ) : null}

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">
          Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback>
                          {initials(
                            submission.student.profile?.firstName,
                            submission.student.profile?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {fullName(submission.student.profile, submission.student.email)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={submission.status === "GRADED" ? "default" : "secondary"}>
                        {submission.status === "GRADED" ? "Graded" : "Submitted"}
                      </Badge>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/submissions/${submission.id}`} target="_blank" rel="noreferrer">
                          <ExternalLink />
                          Open PDF
                        </a>
                      </Button>
                    </div>
                  </div>
                  <GradeForm
                    submissionId={submission.id}
                    maxPoints={assignment.maxPoints}
                    rubric={assignment.rubric}
                    defaultGrade={submission.grade}
                    defaultFeedback={submission.feedback}
                    defaultScores={submission.rubricScores}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
