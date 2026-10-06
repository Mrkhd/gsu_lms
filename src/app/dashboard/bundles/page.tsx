import Link from "next/link"
import { Boxes } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { EmptyState } from "@/components/empty-state"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { formatDate, isExpired } from "@/lib/format"
import { getStudentBundleEnrollments } from "@/lib/queries"

export const metadata = { title: "My bundles" }

export default async function StudentBundlesPage() {
  const user = await requireUser()
  const enrollments = await getStudentBundleEnrollments(user.id)

  return (
    <div>
      <PageHeader
        title="My bundles"
        description="Course bundles you have purchased and the access they unlock."
      />
      {enrollments.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {enrollments.map((enrollment) => {
            const active = enrollment.status === "ACTIVE" && !isExpired(enrollment.expiresAt)
            return (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle>{enrollment.bundle.title}</CardTitle>
                    <StatusBadge status={active ? "ACTIVE" : "EXPIRED"} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {enrollment.expiresAt
                      ? `Access until ${formatDate(enrollment.expiresAt)}`
                      : "Lifetime access"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {enrollment.bundle._count.courses} courses included
                  </p>
                  <ul className="space-y-1.5">
                    {enrollment.bundle.courses.map(({ course }) => (
                      <li key={course.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="size-1.5 rounded-full p-0" />
                        <Link href={`/learn/${course.slug}`} className="hover:underline">
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {!active ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/bundles/${enrollment.bundle.slug}`}>Renew bundle</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Boxes}
          title="No bundles yet"
          description="Buy a bundle to unlock several courses at once."
          action={
            <Button asChild>
              <Link href="/bundles">Browse bundles</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
