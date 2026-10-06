"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { checkoutAction } from "@/server/actions/orders"

export function CheckoutButton({
  itemType,
  itemId,
  label,
  className,
  redirectTo,
  size,
}: {
  itemType: "COURSE" | "BUNDLE"
  itemId: string
  label: string
  className?: string
  redirectTo?: string
  size?: React.ComponentProps<typeof Button>["size"]
}) {
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const onClick = () => {
    startTransition(async () => {
      const result = await checkoutAction(itemType, itemId)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      if (result.status === "success") {
        toast.success(result.message)
        const destination = redirectTo ?? result.data?.redirectTo
        if (destination) {
          router.push(destination)
          router.refresh()
        } else {
          router.refresh()
        }
      }
    })
  }

  return (
    <Button size={size ?? "lg"} className={className} disabled={pending} onClick={onClick}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Processing…" : label}
    </Button>
  )
}
