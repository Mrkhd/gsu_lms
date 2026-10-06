"use client"

import { useEffect } from "react"
import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Route-level error boundary.
 *
 * In production, errors thrown while rendering a Server Component are reported
 * to the client as React's minified "Minified React error #441" / "An error
 * occurred in the Server Components render". The most common cause in this
 * project is the database being unreachable, so we show a clearer hint.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isServerRenderError =
    /Server Components render|Minified React error/i.test(error.message) || !!error.digest

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 p-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-medium">Something went wrong</h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {isServerRenderError
            ? "The server could not load this page's data. This is often a temporary problem — for example the database is starting up or unreachable. Try again in a moment."
            : error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.assign("/")}>
          Go home
        </Button>
      </div>
    </div>
  )
}
