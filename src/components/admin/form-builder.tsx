"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { FORM_FIELD_TYPES, type FormField, type FormFieldType } from "@/db/types"
import { useActionForm } from "@/hooks/use-action-form"
import { createFormAction, updateFormAction } from "@/server/actions/forms"

const FIELD_LABELS: Record<FormFieldType, string> = {
  TEXT: "Short text",
  PARAGRAPH: "Paragraph",
  EMAIL: "Email",
  NUMBER: "Number",
  DATE: "Date",
  SELECT: "Dropdown",
  RADIO: "Multiple choice",
  CHECKBOX: "Single checkbox",
  CHECKBOXES: "Multiple checkboxes",
}

const OPTION_TYPES: FormFieldType[] = ["SELECT", "RADIO", "CHECKBOXES"]
const PLACEHOLDER_TYPES: FormFieldType[] = ["TEXT", "PARAGRAPH", "EMAIL", "NUMBER"]

function newField(): FormField {
  return {
    id: crypto.randomUUID(),
    type: "TEXT",
    label: "",
    required: false,
    placeholder: "",
    options: [],
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function FormBuilder({
  mode,
  form,
}: {
  mode: "create" | "edit"
  form?: {
    id: string
    title: string
    slug: string
    description: string | null
    status: string
    fields: FormField[]
  }
}) {
  const action = mode === "create" ? createFormAction : updateFormAction
  const { state, pending, onSubmit } = useActionForm(action)

  const [title, setTitle] = React.useState(form?.title ?? "")
  const [slug, setSlug] = React.useState(form?.slug ?? "")
  const [slugTouched, setSlugTouched] = React.useState(Boolean(form?.slug))
  const [description, setDescription] = React.useState(form?.description ?? "")
  const [status, setStatus] = React.useState(form?.status ?? "DRAFT")
  const [fields, setFields] = React.useState<FormField[]>(
    form?.fields && form.fields.length > 0 ? form.fields : [newField()]
  )

  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)))

  const move = (index: number, direction: -1 | 1) =>
    setFields((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {form ? <input type="hidden" name="id" value={form.id} /> : null}
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <FormError state={state} />

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              if (!slugTouched) setSlug(slugify(event.target.value))
            }}
            placeholder="Semester 1 registration"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(slugify(event.target.value))
            }}
            placeholder="semester-1-registration"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select name="status" value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived / closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Shown at the top of the public form."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Fields</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setFields((p) => [...p, newField()])}>
            <Plus />
            Add field
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-xl border bg-background p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full space-y-1 sm:w-44">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) =>
                      updateField(field.id, { type: value as FormFieldType })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_FIELD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {FIELD_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-48 flex-1 space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={field.label}
                    onChange={(event) => updateField(field.id, { label: event.target.value })}
                    placeholder="Question text"
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <Checkbox
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(field.id, { required: checked === true })}
                  />
                  Required
                </label>
                <div className="flex items-center gap-1 pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setFields((prev) => prev.filter((item) => item.id !== field.id))}
                    disabled={fields.length === 1}
                    aria-label="Remove field"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              {PLACEHOLDER_TYPES.includes(field.type) ? (
                <div className="space-y-1">
                  <Label className="text-xs">Placeholder</Label>
                  <Input
                    value={field.placeholder ?? ""}
                    onChange={(event) => updateField(field.id, { placeholder: event.target.value })}
                    placeholder="Optional hint text"
                  />
                </div>
              ) : null}

              {OPTION_TYPES.includes(field.type) ? (
                <div className="space-y-1">
                  <Label className="text-xs">Options (one per line)</Label>
                  <Textarea
                    value={(field.options ?? []).join("\n")}
                    onChange={(event) =>
                      updateField(field.id, {
                        options: event.target.value
                          .split("\n")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder={"Option A\nOption B"}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create form" : "Save form"}
        </Button>
      </div>
    </form>
  )
}
