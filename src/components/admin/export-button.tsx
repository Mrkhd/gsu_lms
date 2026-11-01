"use client"

import { useSearchParams } from "next/navigation"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Downloads the current admin table as CSV, preserving the active filters. */
export function ExportButton({
  type,
  extra,
}: {
  type: string
  extra?: Record<string, string>
}) {
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())
  if (extra) {
    for (const [key, value] of Object.entries(extra)) params.set(key, value)
  }
  const query = params.toString()

  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/admin/export/${type}${query ? `?${query}` : ""}`}>
        <Download />
        Export CSV
      </a>
    </Button>
  )
}
