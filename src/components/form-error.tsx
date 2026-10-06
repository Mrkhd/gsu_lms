"use client"

import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ActionState } from "@/lib/action-utils"

export function FormError({ state }: { state: ActionState }) {
  if (state.status !== "error") return null
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>Something needs your attention</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  )
}
