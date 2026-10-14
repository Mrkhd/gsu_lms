"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, LockOpen } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { lockCourseAction, unlockCourseAction } from "@/server/actions/enrollments"

type LockCourse = {
  id: string
  title: string
  slug: string
  locked: boolean
}

export function CourseLockList({
  studentId,
  courses,
}: {
  studentId: string
  courses: LockCourse[]
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const toggle = (course: LockCourse) => {
    setPendingId(course.id)
    startTransition(async () => {
      const result = course.locked
        ? await unlockCourseAction(studentId, course.id)
        : await lockCourseAction(studentId, course.id)
      setPendingId(null)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      if (result.status === "success") {
        toast.success(result.message)
        router.refresh()
      }
    })
  }

  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">No courses to manage yet.</p>
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-background">
      {courses.map((course) => {
        const busy = pending && pendingId === course.id
        return (
          <li key={course.id} className="flex items-center gap-3 px-4 py-3">
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{course.title}</p>
            {course.locked ? <Badge variant="destructive">Locked by admin</Badge> : null}
            <Button
              type="button"
              size="sm"
              variant={course.locked ? "outline" : "destructive"}
              disabled={busy}
              onClick={() => toggle(course)}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : course.locked ? (
                <LockOpen />
              ) : (
                <Lock />
              )}
              {course.locked ? "Unlock" : "Lock"}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
