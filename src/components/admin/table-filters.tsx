"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type TableFilterSelect = {
  key: string
  placeholder: string
  options: { value: string; label: string }[]
}

export function TableFilters({
  basePath,
  searchPlaceholder = "Search…",
  searchKey = "q",
  selects = [],
}: {
  basePath: string
  searchPlaceholder?: string
  searchKey?: string
  selects?: TableFilterSelect[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(searchParams.get(searchKey) ?? "")

  const update = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
      router.push(`${basePath}?${params.toString()}`)
    },
    [basePath, router, searchParams]
  )

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault()
    update(searchKey, query)
  }

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={onSearch} className="relative sm:w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
          aria-label={searchPlaceholder}
        />
      </form>
      {selects.map((select) => (
        <Select
          key={select.key}
          value={searchParams.get(select.key) ?? "all"}
          onValueChange={(value) => update(select.key, value)}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder={select.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{select.placeholder}</SelectItem>
            {select.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
]

export const USER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
]

export const ENROLLMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
]
