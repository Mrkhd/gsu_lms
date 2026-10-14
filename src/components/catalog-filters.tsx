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

type Category = { id: string; name: string; slug: string }

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
]

export function CatalogFilters({
  basePath,
  categories,
  programs = [],
  showSort = true,
}: {
  basePath: string
  categories: Category[]
  programs?: { id: string; slug: string; title: string }[]
  showSort?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "")

  const update = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") params.set(key, value)
      else params.delete(key)
      params.delete("page")
      router.push(`${basePath}?${params.toString()}`)
    },
    [basePath, router, searchParams]
  )

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault()
    update("q", query)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={onSearch} className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses"
          className="pl-8"
          aria-label="Search courses"
        />
      </form>
      {categories.length > 0 ? (
        <Select
          value={searchParams.get("category") ?? "all"}
          onValueChange={(value) => update("category", value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {programs.length > 0 ? (
        <Select
          value={searchParams.get("program") ?? "all"}
          onValueChange={(value) => update("program", value)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((program) => (
              <SelectItem key={program.id} value={program.slug}>
                {program.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {showSort ? (
        <Select
          value={searchParams.get("sort") ?? "newest"}
          onValueChange={(value) => update("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((sort) => (
              <SelectItem key={sort.value} value={sort.value}>
                {sort.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
