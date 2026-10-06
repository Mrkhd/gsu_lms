import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { PageHeader } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireAdmin } from "@/lib/auth/server"
import { formatOrderNumber, formatPrice, fullName } from "@/lib/format"
import { getOrderWithItems } from "@/lib/orders"
import { cancelOrderAction, refundOrderAction } from "@/server/actions/orders"

export const metadata = { title: "Order" }

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const order = await getOrderWithItems(id)
  if (!order) notFound()

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/orders">
          <ArrowLeft />
          Back to orders
        </Link>
      </Button>
      <PageHeader
        title={`Order ${formatOrderNumber(order.number)}`}
        description={fullName(order.student.profile, order.student.email)}
        actions={
          <>
            <StatusBadge status={order.status} />
            {order.status === "PAID" ? (
              <ActionButton
                variant="destructive"
                size="sm"
                action={refundOrderAction.bind(null, order.id)}
                confirm={{
                  title: "Refund this order?",
                  description: "Access granted by this order will be revoked.",
                  confirmLabel: "Refund",
                }}
              >
                Refund
              </ActionButton>
            ) : order.status === "PENDING" || order.status === "FAILED" ? (
              <ActionButton
                variant="outline"
                size="sm"
                action={cancelOrderAction.bind(null, order.id)}
              >
                Cancel order
              </ActionButton>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="pr-6 text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">{item.title}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.itemType} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {formatPrice(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>{formatPrice(order.discount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span>{order.provider ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="max-w-40 truncate">{order.providerRef ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
