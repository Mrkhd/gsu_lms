"use client"

import * as React from "react"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { uploadMediaAction } from "@/server/actions/uploads"
import { idleState } from "@/lib/action-utils"

export function MediaUpload({
  prefix,
  onUploaded,
  label = "Upload",
}: {
  prefix: string
  onUploaded: (url: string) => void
  label?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [pending, startTransition] = React.useTransition()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.set("file", file)
    formData.set("prefix", prefix)
    startTransition(async () => {
      const result = await uploadMediaAction(idleState, formData)
      if (result.status === "error") {
        toast.error(result.message)
        return
      }
      if (result.status === "success" && result.data) {
        toast.success(result.message)
        onUploaded(result.data.url)
      }
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  return (
    <>
      <input ref={inputRef} type="file" hidden onChange={onChange} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload />}
        {pending ? "Uploading…" : label}
      </Button>
    </>
  )
}
