import Link from "next/link"

import { APP_NAME } from "@/lib/constants"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Link href="/" className="font-heading text-xl font-semibold">
        {APP_NAME}
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to the platform terms.
      </p>
    </div>
  )
}
