"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { MediaUpload } from "@/components/admin/media-upload"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useActionForm } from "@/hooks/use-action-form"
import { createLessonAction, updateLessonAction } from "@/server/actions/courses"

type LessonDefaults = {
  id: string
  title: string
  type: string
  videoUrl: string | null
  content: string | null
  pdfUrl: string | null
  durationMinutes: number | null
  isPreview: boolean
  availableAt: Date | string | null
}

function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function LessonDialog({
  courseId,
  sectionId,
  lesson,
  trigger,
}: {
  courseId: string
  sectionId: string
  lesson?: LessonDefaults
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [videoUrl, setVideoUrl] = React.useState(lesson?.videoUrl ?? "")
  const [pdfUrl, setPdfUrl] = React.useState(lesson?.pdfUrl ?? "")
  const [availableAt, setAvailableAt] = React.useState(toLocalInput(lesson?.availableAt))
  const { state, pending, onSubmit } = useActionForm(
    lesson ? updateLessonAction : createLessonAction,
    { onSuccess: () => setOpen(false) }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit lesson" : "Add lesson"}</DialogTitle>
          <DialogDescription>
            Video lessons use an external URL. Text lessons use rich content; document lessons link
            a PDF, DOC or DOCX file.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="sectionId" value={sectionId} />
          <input
            type="hidden"
            name="availableAt"
            value={availableAt ? new Date(availableAt).toISOString() : ""}
          />
          {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}
          <FormError state={state} />

          <div className="space-y-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input id="lesson-title" name="title" defaultValue={lesson?.title} required autoFocus />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Type</Label>
              <Select name="type" defaultValue={lesson?.type ?? "VIDEO"}>
                <SelectTrigger id="lesson-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="DOCUMENT">Document (DOCX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-duration">Duration (minutes)</Label>
              <Input
                id="lesson-duration"
                name="durationMinutes"
                type="number"
                min={0}
                defaultValue={lesson?.durationMinutes ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-available">Release date (optional)</Label>
            <Input
              id="lesson-available"
              type="datetime-local"
              value={availableAt}
              onChange={(event) => setAvailableAt(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Students can see this lesson but cannot open it until this date.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="lesson-video">Video URL</Label>
              <MediaUpload prefix="lessons" label="Upload video" onUploaded={setVideoUrl} />
            </div>
            <Input
              id="lesson-video"
              name="videoUrl"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://… (or upload to R2)"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="lesson-pdf">Document file</Label>
              <MediaUpload
                prefix="materials"
                label="Upload document"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onUploaded={setPdfUrl}
              />
            </div>
            <Input
              id="lesson-pdf"
              name="pdfUrl"
              value={pdfUrl}
              onChange={(event) => setPdfUrl(event.target.value)}
              placeholder="https://… (or upload a PDF/DOCX)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-content">Content</Label>
            <Textarea
              id="lesson-content"
              name="content"
              rows={5}
              defaultValue={lesson?.content ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-preview">Free preview</Label>
            <Select name="isPreview" defaultValue={lesson?.isPreview ? "true" : "false"}>
              <SelectTrigger id="lesson-preview" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {lesson ? "Save lesson" : "Add lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
