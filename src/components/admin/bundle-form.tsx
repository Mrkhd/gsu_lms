"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"

import { FormError } from "@/components/form-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"
import { idleState, type ActionState } from "@/lib/action-utils"
import { createBundleAction, updateBundleAction } from "@/server/actions/bundles"

export type BundleFormValues = {
  title: string
  slug: string
  shortDescription: string
  description: string
  thumbnailUrl: string
  price: string
  accessDurationDays: string
  status: string
  courseIds: string[]
}

export function BundleForm({
  mode,
  bundleId,
  defaultValues,
  courses,
}: {
  mode: "create" | "edit"
  bundleId?: string
  defaultValues: BundleFormValues
  courses: { id: string; title: string; price: number }[]
}) {
  const form = useForm<BundleFormValues>({ defaultValues })
  const [state, setState] = React.useState<ActionState>(idleState)
  const [pending, startTransition] = React.useTransition()

  const selected = form.watch("courseIds")
  const individualValue = courses
    .filter((course) => selected.includes(course.id))
    .reduce((sum, course) => sum + course.price, 0)

  const onSubmit = form.handleSubmit((values) => {
    const formData = new FormData()
    formData.set("title", values.title)
    formData.set("slug", values.slug)
    formData.set("shortDescription", values.shortDescription)
    formData.set("description", values.description)
    formData.set("thumbnailUrl", values.thumbnailUrl)
    formData.set("price", values.price)
    formData.set("accessDurationDays", values.accessDurationDays)
    formData.set("status", values.status)
    values.courseIds.forEach((id) => formData.append("courseIds", id))
    if (bundleId) formData.set("bundleId", bundleId)

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createBundleAction(idleState, formData)
          : await updateBundleAction(idleState, formData)
      setState(result)
      if (result.status === "error" && result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          form.setError(field as keyof BundleFormValues, { message: messages[0] })
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
            <CardTitle>Basic information</CardTitle>
            <CardDescription>Bundle details shown to students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bundle name</FormLabel>
                    <FormControl>
                      <Input placeholder="Web Development Bundle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Included courses</CardTitle>
            <CardDescription>
              Select the courses that make up this bundle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={form.control}
              name="courseIds"
              render={({ field }) => (
                <ScrollArea className="max-h-72 rounded-lg border">
                  <div className="divide-y">
                    {courses.map((course) => {
                      const checked = field.value.includes(course.id)
                      return (
                        <label
                          key={course.id}
                          className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              field.onChange(
                                value
                                  ? [...field.value, course.id]
                                  : field.value.filter((id) => id !== course.id)
                              )
                            }
                          />
                          <span className="flex-1 text-sm">{course.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(course.price)}
                          </span>
                        </label>
                      )
                    })}
                    {courses.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">No published courses yet.</p>
                    ) : null}
                  </div>
                </ScrollArea>
              )}
            />
            {form.formState.errors.courseIds ? (
              <p className="mt-2 text-sm text-destructive">
                {form.formState.errors.courseIds.message}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Badge variant="secondary">{selected.length} selected</Badge>
              <span className="text-muted-foreground">
                Individual value: {formatCurrency(individualValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing &amp; access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bundle price (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessDurationDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access duration</FormLabel>
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
          </CardContent>
        </Card>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Create bundle" : "Save bundle"}
        </Button>
      </form>
    </Form>
  )
}
