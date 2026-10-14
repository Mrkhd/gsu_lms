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

type ProgramOption = {
  id: string
  title: string
  semesters: { id: string; title: string; number: number | null }[]
}

export function EnrollmentGrantDialog({
  students,
  programs,
  trigger,
}: {
  students: { id: string; name: string }[]
  programs: ProgramOption[]
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [programId, setProgramId] = React.useState("")
  const [semesterId, setSemesterId] = React.useState("")
  const { state, pending, onSubmit } = useActionForm(grantEnrollmentAction, {
    onSuccess: () => setOpen(false),
  })

  const semesters = programs.find((program) => program.id === programId)?.semesters ?? []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign to program</DialogTitle>
          <DialogDescription>
            Enroll a student in a program and one of its semesters. Every course in the semester is
            unlocked at once.
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
            <Label>Program</Label>
            <Select
              name="programId"
              value={programId}
              onValueChange={(value) => {
                setProgramId(value)
                setSemesterId("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Semester</Label>
            <Select
              name="bundleId"
              value={semesterId}
              onValueChange={setSemesterId}
              disabled={!programId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={programId ? "Select a semester" : "Choose a program first"}
                />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.number ? `Semester ${semester.number}` : semester.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Button type="submit" disabled={pending || !programId || !semesterId}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
