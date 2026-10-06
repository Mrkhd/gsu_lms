import Link from "next/link"
import { Bell } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getNotifications } from "@/lib/chat"
import { formatDate } from "@/lib/format"
import { markAllNotificationsReadAction } from "@/server/actions/notifications"

export const metadata = { title: "Notifications" }

export default async function NotificationsPage() {
  const user = await requireUser()
  const items = await getNotifications(user.id)
  const hasUnread = items.some((item) => !item.read)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Notifications</h1>
        {hasUnread ? (
          <ActionButton size="sm" variant="outline" action={markAllNotificationsReadAction}>
            Mark all as read
          </ActionButton>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={item.read ? "" : "ring-primary/40"}>
              <CardContent className="space-y-1 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  {!item.read ? <span className="size-2 rounded-full bg-primary" /> : null}
                </div>
                {item.body ? (
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                ) : null}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatDate(item.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {item.url ? (
                    <Link href={item.url} className="font-medium text-primary hover:underline">
                      Open
                    </Link>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
