import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="font-heading text-5xl font-semibold">404</p>
      <h1 className="font-heading text-xl font-medium">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you are looking for may have been moved, deleted, or never existed.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    </div>
  )
}
