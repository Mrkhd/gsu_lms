"use client"

import { CheckCircle2, Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FormField } from "@/db/types"
import { useActionForm } from "@/hooks/use-action-form"
import { submitFormAction } from "@/server/actions/forms"

const controlClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

function FieldControl({ field }: { field: FormField }) {
  const required = field.required

  switch (field.type) {
    case "PARAGRAPH":
      return (
        <Textarea
          id={field.id}
          name={field.id}
          required={required}
          placeholder={field.placeholder || undefined}
          rows={4}
        />
      )
    case "SELECT":
      return (
        <select id={field.id} name={field.id} required={required} className={controlClass} defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
    case "RADIO":
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="radio" name={field.id} value={option} required={required} className="size-4" />
              {option}
            </label>
          ))}
        </div>
      )
    case "CHECKBOX":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={field.id} className="size-4" />
          {field.placeholder || "Yes"}
        </label>
      )
    case "CHECKBOXES":
      return (
        <div className="space-y-2">
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={field.id} value={option} className="size-4" />
              {option}
            </label>
          ))}
        </div>
      )
    default:
      return (
        <Input
          id={field.id}
          name={field.id}
          type={field.type === "EMAIL" ? "email" : field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
          required={required}
          placeholder={field.placeholder || undefined}
        />
      )
  }
}

export function PublicForm({
  formId,
  title,
  description,
  fields,
}: {
  formId: string
  title: string
  description: string | null
  fields: FormField[]
}) {
  const { state, pending, onSubmit } = useActionForm(submitFormAction)

  if (state.status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <p className="font-heading text-lg font-semibold">Response submitted</p>
          <p className="text-sm text-muted-foreground">
            Thank you. Your response to {title} has been recorded.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <p className="text-sm whitespace-pre-line text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <input type="hidden" name="formId" value={formId} />
          <FormError state={state} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="respondent-name">Your name</Label>
              <Input id="respondent-name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="respondent-email">Email</Label>
              <Input id="respondent-email" name="email" type="email" required autoComplete="email" />
            </div>
          </div>

          {fields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id}>
                {field.label}
                {field.required ? <span className="text-destructive"> *</span> : null}
              </Label>
              <FieldControl field={field} />
            </div>
          ))}

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Submit response
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
