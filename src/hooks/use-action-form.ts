"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { idleState, type ActionState } from "@/lib/action-utils"

export function useActionForm(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  options?: { onSuccess?: () => void; successToast?: boolean }
) {
  const [state, setState] = React.useState<ActionState>(idleState)
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await action(idleState, formData)
      setState(result)
      if (result.status === "success") {
        options?.onSuccess?.()
        if (options?.successToast !== false) toast.success(result.message)
        router.refresh()
      }
    })
  }

  return { state, pending, onSubmit }
}
