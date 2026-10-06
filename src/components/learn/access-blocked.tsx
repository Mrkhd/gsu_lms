import Link from "next/link"
import { Lock, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"

export function AccessBlocked({
  course,
  reason,
  expiresAt,
}: {
  course: { slug: string; title: string }
  reason: "NONE" | "EXPIRED" | "CANCELLED"
  expiresAt?: Date | null
}) {
  const expired = reason === "EXPIRED"
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-20">
      <Card>
        <CardHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="size-5" />
          </div>
          <CardTitle>
            {expired ? "Course access expired" : "You do not have access to this course"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {expired
              ? `Your access to ${course.title} ended on ${formatDate(expiresAt)}.`
              : `Enroll in ${course.title} to start learning.`}
          </p>
          <div className="flex flex-wrap gap-3">
            {expired ? (
              <Button asChild>
                <Link href={`/checkout/course/${course.slug}`}>
                  <RefreshCw />
                  Renew access
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/courses/${course.slug}`}>View course</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/courses">Browse more courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
