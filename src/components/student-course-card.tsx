import Link from "next/link"
import { Clock, InfinityIcon, Lock, PlayCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Thumbnail } from "@/components/thumbnail"
import { formatDate, fullName, isExpired } from "@/lib/format"
import type { StudentCourseItem } from "@/lib/queries"

export function StudentCourseCard({ item }: { item: StudentCourseItem }) {
  const { enrollment, course, progress, completed, total, locked } = item
  const active = enrollment.status === "ACTIVE" && !isExpired(enrollment.expiresAt)
  const lifetime = enrollment.expiresAt === null

  return (
    <Card className="h-full gap-0 pt-0">
      <Thumbnail
        src={course.thumbnailUrl}
        alt={course.title}
        seed={course.slug}
        className="aspect-video w-full"
      />
      <CardContent className="flex flex-1 flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/courses/${course.slug}`} className="font-medium hover:underline">
            {course.title}
          </Link>
          {locked ? (
            <Badge variant="destructive">Locked by admin</Badge>
          ) : !active ? (
            <Badge variant="destructive">Expired</Badge>
          ) : (
            <Badge variant="default">Active</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {fullName(course.instructor.profile, "Instructor")}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">
            {completed} of {total} lessons completed
          </p>
        </div>

        <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          {lifetime ? (
            <>
              <InfinityIcon className="size-3.5" />
              Lifetime access
            </>
          ) : (
            <>
              <Clock className="size-3.5" />
              Access until {formatDate(enrollment.expiresAt)}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {locked ? (
          <Button variant="outline" className="w-full" disabled>
            <Lock />
            Locked by admin
          </Button>
        ) : active ? (
          <Button asChild className="w-full">
            <Link href={`/learn/${course.slug}`}>
              <PlayCircle />
              {progress > 0 ? "Continue learning" : "Start course"}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/courses/${course.slug}`}>View course</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
