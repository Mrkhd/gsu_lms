"use client"

import * as React from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  body: string
  senderId: string
  senderName: string
  createdAt: string
}

export function ChatPanel({
  conversationId,
  currentUserId,
  placeholder = "No messages yet — say hello.",
  className,
}: {
  conversationId: string
  currentUserId: string
  placeholder?: string
  className?: string
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [value, setValue] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        cache: "no-store",
      })
      if (!res.ok) return
      const data = (await res.json()) as { messages: ChatMessage[] }
      setMessages(data.messages)
    } catch {
      // ignore transient network errors
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  React.useEffect(() => {
    const initial = setTimeout(() => void load(), 0)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load()
    }, 3000)
    return () => {
      clearTimeout(initial)
      clearInterval(timer)
    }
  }, [load])

  React.useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    const body = value.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        toast.error("Could not send the message.")
        return
      }
      const data = (await res.json()) as { message: ChatMessage }
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]))
      setValue("")
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className={cn("flex h-[60vh] flex-col overflow-hidden rounded-xl border", className)}>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId
            return (
              <div
                key={message.id}
                className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
              >
                <Avatar className="size-7">
                  <AvatarFallback>{initials(message.senderName)}</AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {!mine ? (
                    <p className="mb-0.5 text-xs font-medium opacity-70">{message.senderName}</p>
                  ) : null}
                  <p className="break-words whitespace-pre-line">{message.body}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Write a message…"
          className="min-h-9 resize-none"
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void send()}
          disabled={sending || !value.trim()}
          aria-label="Send message"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send />}
        </Button>
      </div>
    </div>
  )
}
