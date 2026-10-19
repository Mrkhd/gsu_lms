"use client"

import * as React from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { FileText, GripVertical, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { LessonDialog } from "@/components/admin/lesson-dialog"
import { SectionDialog } from "@/components/admin/section-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import {
  deleteLessonAction,
  deleteSectionAction,
  reorderLessonsAction,
  reorderSectionsAction,
} from "@/server/actions/courses"

export type BuilderLesson = {
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

export type BuilderSection = {
  id: string
  title: string
  lessons: BuilderLesson[]
}

export function CurriculumBuilder({
  courseId,
  sections: initialSections,
}: {
  courseId: string
  sections: BuilderSection[]
}) {
  const [sections, setSections] = React.useState(initialSections)
  const [, startTransition] = React.useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = sections.map((section) => section.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(sections, oldIndex, newIndex)
    setSections(next)
    startTransition(async () => {
      await reorderSectionsAction(
        courseId,
        next.map((section) => section.id)
      )
    })
  }

  const reorderLessons = (sectionId: string, orderedIds: string[]) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lessons: orderedIds
                .map((id) => section.lessons.find((lesson) => lesson.id === id))
                .filter((lesson): lesson is BuilderLesson => Boolean(lesson)),
            }
          : section
      )
    )
    startTransition(async () => {
      await reorderLessonsAction(sectionId, orderedIds)
    })
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SortableSection
                key={section.id}
                section={section}
                index={index}
                courseId={courseId}
                onLessonsReorder={reorderLessons}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No sections yet. Add your first section to start building the curriculum.
        </p>
      ) : null}

      <SectionDialog
        courseId={courseId}
        trigger={
          <Button variant="outline" size="sm">
            <Plus />
            Add section
          </Button>
        }
      />
    </div>
  )
}

function SortableSection({
  section,
  index,
  courseId,
  onLessonsReorder,
}: {
  section: BuilderSection
  index: number
  courseId: string
  onLessonsReorder: (sectionId: string, orderedIds: string[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = section.lessons.map((lesson) => lesson.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    onLessonsReorder(section.id, arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-xl border bg-background", isDragging && "opacity-70")}
    >
      <div className="flex items-center gap-2 border-b p-3">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label="Reorder section"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="text-xs text-muted-foreground">Section {index + 1}</span>
        <span className="truncate font-medium">{section.title}</span>
        <div className="ml-auto flex items-center gap-1">
          <LessonDialog
            courseId={courseId}
            sectionId={section.id}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Add lesson">
                <Plus />
              </Button>
            }
          />
          <SectionDialog
            courseId={courseId}
            section={section}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Rename section">
                <Pencil />
              </Button>
            }
          />
          <ActionButton
            variant="ghost"
            size="icon-sm"
            aria-label="Delete section"
            action={deleteSectionAction.bind(null, section.id)}
            confirm={{
              title: "Delete this section?",
              description: "All lessons in this section will be removed.",
              confirmLabel: "Delete",
            }}
          >
            <Trash2 />
          </ActionButton>
        </div>
      </div>

      <div className="p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleLessonDragEnd}
        >
          <SortableContext
            items={section.lessons.map((lesson) => lesson.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {section.lessons.map((lesson) => (
                <SortableLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  courseId={courseId}
                  sectionId={section.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {section.lessons.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No lessons yet.</p>
        ) : null}
      </div>
    </div>
  )
}

function SortableLessonRow({
  lesson,
  courseId,
  sectionId,
}: {
  lesson: BuilderLesson
  courseId: string
  sectionId: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted",
        isDragging && "bg-muted opacity-80"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Reorder lesson"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {lesson.type === "VIDEO" ? (
        <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <FileText className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 truncate text-sm">{lesson.title}</span>
      {lesson.isPreview ? (
        <span className="text-xs text-muted-foreground">Preview</span>
      ) : null}
      {lesson.durationMinutes ? (
        <span className="text-xs text-muted-foreground">
          {formatDuration(lesson.durationMinutes)}
        </span>
      ) : null}
      <LessonDialog
        courseId={courseId}
        sectionId={sectionId}
        lesson={lesson}
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label="Edit lesson">
            <Pencil />
          </Button>
        }
      />
      <ActionButton
        variant="ghost"
        size="icon-sm"
        aria-label="Delete lesson"
        action={deleteLessonAction.bind(null, lesson.id)}
        confirm={{
          title: "Delete this lesson?",
          description: "This action cannot be undone.",
          confirmLabel: "Delete",
        }}
      >
        <Trash2 />
      </ActionButton>
    </div>
  )
}
