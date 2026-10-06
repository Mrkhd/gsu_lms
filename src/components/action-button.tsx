"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ActionState } from "@/lib/action-utils"

type ActionButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick" | "type"> & {
  action: () => Promise<ActionState>
  onSuccess?: () => void
  confirm?: {
    title: string
    description?: string
    confirmLabel?: string
  }
}

export function ActionButton({ action, children, onSuccess, confirm, ...props }: ActionButtonProps) {
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const run = React.useCallback(() => {
    startTransition(async () => {
      const result = await action()
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      if (result.status === "success") {
        toast.success(result.message)
        onSuccess?.()
        router.refresh()
      }
    })
  }, [action, onSuccess, router])

  if (confirm) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" disabled={pending} {...props}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {children}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            {confirm.description ? (
              <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>
              {confirm.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button type="button" disabled={pending} onClick={run} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}
