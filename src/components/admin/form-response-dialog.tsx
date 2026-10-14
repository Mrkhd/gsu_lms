"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { FormField } from "@/db/types"
import { formatDate } from "@/lib/format"

function formatAnswer(field: FormField, value: unknown) {
  if (value === undefined || value === null || value === "") return "—"
  if (field.type === "CHECKBOX") return value ? "Yes" : "No"
  if (field.type === "CHECKBOXES") {
    return Array.isArray(value) && value.length > 0 ? value.join(", ") : "—"
  }
  return String(value)
}

export function FormResponseDialog({
  title,
  fields,
  response,
  trigger,
}: {
  title: string
  fields: FormField[]
  response: { name: string; email: string; createdAt: Date; answers: Record<string, unknown> }
  trigger: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="font-medium">{response.name}</p>
            <p className="text-muted-foreground">{response.email}</p>
            <p className="text-xs text-muted-foreground">{formatDate(response.createdAt)}</p>
          </div>
          <dl className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {field.label}
                </dt>
                <dd className="text-sm whitespace-pre-line">
                  {formatAnswer(field, response.answers[field.id])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  )
}
