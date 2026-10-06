import Link from "next/link"
import { CreditCard } from "lucide-react"

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
import { requireUser } from "@/lib/auth/server"
import { formatOrderNumber, formatPrice, formatShortDate } from "@/lib/format"
import { getStudentOrders } from "@/lib/queries"
import { payOrderAction } from "@/server/actions/orders"

export const metadata = { title: "Orders" }

export default async function OrdersPage() {
  const user = await requireUser()
  const orders = await getStudentOrders(user.id)

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Your purchase history and payment status."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />
      {orders.length > 0 ? (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{formatOrderNumber(order.number)}</TableCell>
                  <TableCell>{formatShortDate(order.createdAt)}</TableCell>
                  <TableCell className="max-w-xs">
                    {order.items.map((item) => item.title).join(", ")}
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "PENDING" ? (
                      <ActionButton
                        size="sm"
                        variant="outline"
                        action={payOrderAction.bind(null, order.id)}
                      >
                        Pay now
                      </ActionButton>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={CreditCard}
          title="No orders yet"
          description="Your purchases will appear here."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
