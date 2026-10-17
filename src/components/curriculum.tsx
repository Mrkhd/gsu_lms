import { FileText, Lock, PlayCircle, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatDuration } from "@/lib/format"

export type CurriculumSection = {
  id: string
  title: string
  lessons: {
    id: string
    title: string
    type: string
    durationMinutes: number | null
    isPreview: boolean
  }[]
}

function LessonIcon({ type }: { type: string }) {
  if (type === "TEXT" || type === "PDF" || type === "DOCUMENT") {
    return <FileText className="size-4 text-muted-foreground" />
  }
  return <PlayCircle className="size-4 text-muted-foreground" />
}

export function Curriculum({ sections }: { sections: CurriculumSection[] }) {
  const total = sections.reduce((sum, section) => sum + section.lessons.length, 0)
  const minutes = sections.reduce(
    (sum, section) =>
      sum + section.lessons.reduce((s, lesson) => s + (lesson.durationMinutes ?? 0), 0),
    0
  )

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {sections.length} sections · {total} lessons
        {minutes ? ` · ${formatDuration(minutes)} total` : ""}
      </p>
      <Accordion type="multiple" defaultValue={sections.slice(0, 1).map((s) => s.id)}>
        {sections.map((section, index) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger>
              <span className="flex items-center gap-2 text-left">
                <span className="text-muted-foreground">Section {index + 1}</span>
                <span className="font-medium">{section.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="divide-y">
                {section.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-3 py-2.5">
                    <LessonIcon type={lesson.type} />
                    <span className="flex-1 text-sm">{lesson.title}</span>
                    {lesson.isPreview ? (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="size-3" />
                        Preview
                      </Badge>
                    ) : (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                    {lesson.durationMinutes ? (
                      <span className="w-14 text-right text-xs text-muted-foreground">
                        {formatDuration(lesson.durationMinutes)}
                      </span>
                    ) : null}
                  </li>
                ))}
                {section.lessons.length === 0 ? (
                  <li className="py-2.5 text-sm text-muted-foreground">No lessons yet.</li>
                ) : null}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
