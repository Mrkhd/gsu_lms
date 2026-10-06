"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { formatPrice } from "@/lib/format"
import { idleState, type ActionState } from "@/lib/action-utils"
import { createProgramAction, updateProgramAction } from "@/server/actions/programs"

export type ProgramFormValues = {
  title: string
  slug: string
  code: string
  shortDescription: string
  description: string
  thumbnailUrl: string
  level: string
  semesterCount: string
  accessDurationDays: string
  status: string
}

type SemesterMapping = { bundleId: string; title: string }

export function ProgramForm({
  mode,
  programId,
  defaultValues,
  defaultSemesters,
  bundles,
}: {
  mode: "create" | "edit"
  programId?: string
  defaultValues: ProgramFormValues
  defaultSemesters: Record<number, SemesterMapping>
  bundles: { id: string; title: string; price: number }[]
}) {
  const form = useForm<ProgramFormValues>({ defaultValues })
  const [mappings, setMappings] = React.useState<Record<number, SemesterMapping>>(defaultSemesters)
  const [state, setState] = React.useState<ActionState>(idleState)
  const [pending, startTransition] = React.useTransition()

  const semesterCount = Math.max(1, Number(form.watch("semesterCount")) || 4)

  const updateMapping = (number: number, patch: Partial<SemesterMapping>) => {
    setMappings((prev) => {
      const current = prev[number] ?? { bundleId: "", title: `Semester ${number}` }
      return { ...prev, [number]: { ...current, ...patch } }
    })
  }

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData()
    Object.entries(values).forEach(([key, value]) => formData.set(key, String(value ?? "")))
    if (programId) formData.set("programId", programId)

    const count = Math.max(1, Number(values.semesterCount) || 4)
    for (let number = 1; number <= count; number++) {
      const mapping = mappings[number]
      if (mapping?.bundleId) {
        formData.set(`semester_${number}_bundleId`, mapping.bundleId)
        formData.set(`semester_${number}_title`, mapping.title || `Semester ${number}`)
      }
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProgramAction(idleState, formData)
          : await updateProgramAction(idleState, formData)
      setState(result)
      if (result.status === "error" && result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof ProgramFormValues, { message: messages[0] })
        }
      }
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError state={state} />
        {state.status === "success" ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            {state.message}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Program information</CardTitle>
            <CardDescription>Degree details shown to prospective students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="BSc Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="BSC-CS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="auto-generated" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Certificate">Certificate</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Bachelor">Bachelor</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="semesterCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of semesters</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={12} {...field} />
                    </FormControl>
                    <FormDescription>Typically 4 for an undergraduate degree.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accessDurationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access duration per semester</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester mapping</CardTitle>
            <CardDescription>
              Assign a semester package (bundle of courses) to each semester. Students pay per
              semester.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: semesterCount }, (_, index) => index + 1).map((number) => {
              const mapping = mappings[number] ?? { bundleId: "", title: `Semester ${number}` }
              return (
                <div
                  key={number}
                  className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr_1fr]"
                >
                  <span className="text-sm font-medium whitespace-nowrap">Semester {number}</span>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Title</label>
                    <Input
                      value={mapping.title}
                      onChange={(event) =>
                        updateMapping(number, { title: event.target.value })
                      }
                      placeholder={`Semester ${number}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Package</label>
                    <Select
                      value={mapping.bundleId || "none"}
                      onValueChange={(value) =>
                        updateMapping(number, { bundleId: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No package</SelectItem>
                        {bundles.map((bundle) => (
                          <SelectItem key={bundle.id} value={bundle.id}>
                            {bundle.title} · {formatPrice(bundle.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create program" : "Save program"}
        </Button>
      </form>
    </Form>
  )
}
