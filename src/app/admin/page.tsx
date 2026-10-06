import Link from "next/link"
import { BookOpen, Boxes, DollarSign, GraduationCap } from "lucide-react"

import { OverviewChart } from "@/components/admin/overview-chart"
import { PageHeader } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireAdmin } from "@/lib/auth/server"
import { formatCurrency, formatOrderNumber, formatShortDate, fullName } from "@/lib/format"
import { getAdminStats } from "@/lib/queries"

export const metadata = { title: "Admin" }

export default async function AdminDashboardPage() {
  await requireAdmin()
  const stats = await getAdminStats()

  const chartData = [...stats.recentOrders]
    .reverse()
    .map((order) => ({
      label: formatOrderNumber(order.number),
      value: Number(order.total),
    }))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A quick overview of your learning platform."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/courses/new">New course</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={BookOpen} label="Courses" value={stats.courses} />
        <StatCard icon={Boxes} label="Bundles" value={stats.bundles} />
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(stats.revenue)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        {formatOrderNumber(order.number)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatShortDate(order.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-40 truncate">
                      {fullName(order.student.profile, order.student.email)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {stats.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="pl-6 text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
