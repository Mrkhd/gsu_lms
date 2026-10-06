import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireAdmin } from "@/lib/auth/server"
import { formatOrderNumber, formatPrice, formatShortDate, fullName } from "@/lib/format"
import { getAdminOrders } from "@/lib/queries"
import { cancelOrderAction, refundOrderAction } from "@/server/actions/orders"

export const metadata = { title: "Orders" }

export default async function AdminOrdersPage() {
  await requireAdmin()
  const orders = await getAdminOrders()

  return (
    <div>
      <PageHeader title="Orders" description={`${orders.length} orders.`} />
      {orders.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      {formatOrderNumber(order.number)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-40 truncate">
                    {fullName(order.student.profile, order.student.email)}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {order.items.map((item) => item.title).join(", ")}
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatShortDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                      {order.status === "PAID" ? (
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          action={refundOrderAction.bind(null, order.id)}
                          confirm={{
                            title: "Refund this order?",
                            description:
                              "Access granted by this order will be revoked immediately.",
                            confirmLabel: "Refund",
                          }}
                        >
                          Refund
                        </ActionButton>
                      ) : order.status === "PENDING" || order.status === "FAILED" ? (
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          action={cancelOrderAction.bind(null, order.id)}
                        >
                          Cancel
                        </ActionButton>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState icon={ShoppingCart} title="No orders yet" />
      )}
    </div>
  )
}
