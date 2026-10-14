import Link from "next/link"
import { Lock, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"

export function AccessBlocked({
  course,
  reason,
  expiresAt,
}: {
  course: { slug: string; title: string }
  reason: "NONE" | "EXPIRED" | "CANCELLED" | "LOCKED"
  expiresAt?: Date | null
}) {
  const locked = reason === "LOCKED"
  const expired = reason === "EXPIRED"
  const title = locked
    ? "Locked by admin"
    : expired
      ? "Course access expired"
      : "You do not have access to this course"
  const description = locked
    ? `${course.title} has been locked for your account by an administrator. Contact your program administrator if you think this is a mistake.`
    : expired
      ? `Your access to ${course.title} ended on ${formatDate(expiresAt)}.`
      : `Enroll in ${course.title} to start learning.`

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            {locked ? <ShieldAlert className="size-5" /> : <Lock className="size-5" />}
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/courses/${course.slug}`}>View course</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">Browse more courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
