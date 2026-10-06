"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { useActionForm } from "@/hooks/use-action-form"
import { grantEnrollmentAction } from "@/server/actions/enrollments"

export function EnrollmentGrantDialog({
  students,
  courses,
  bundles,
  trigger,
}: {
  students: { id: string; name: string }[]
  courses: { id: string; title: string }[]
  bundles: { id: string; title: string }[]
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [kind, setKind] = React.useState<"COURSE" | "BUNDLE">("COURSE")
  const { state, pending, onSubmit } = useActionForm(grantEnrollmentAction, {
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant enrollment</DialogTitle>
          <DialogDescription>
            Give a student access to a course or bundle without payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormError state={state} />
          <div className="space-y-2">
            <Label>Student</Label>
            <Select name="studentId">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Access type</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as "COURSE" | "BUNDLE")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COURSE">Single course</SelectItem>
                <SelectItem value="BUNDLE">Bundle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "COURSE" ? (
            <div className="space-y-2">
              <Label>Course</Label>
              <Select name="courseId">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Bundle</Label>
              <Select name="bundleId">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Access duration</Label>
            <Select name="accessDurationDays" defaultValue="180">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_DURATION_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.label}
                    value={preset.days === null ? "lifetime" : String(preset.days)}
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Grant access
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
