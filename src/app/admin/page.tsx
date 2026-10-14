import Link from "next/link"
import { BookOpen, Boxes, GraduationCap } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth/server"
import { getAdminStats } from "@/lib/queries"

export const metadata = { title: "Admin" }

export default async function AdminDashboardPage() {
  await requireAdmin()
  const stats = await getAdminStats()

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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Students" value={stats.students} />
        <StatCard icon={BookOpen} label="Courses" value={stats.courses} />
        <StatCard icon={Boxes} label="Semesters" value={stats.bundles} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/programs">Manage programs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/enrollments">Manage enrollments</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/students">Manage students</Link>
        </Button>
      </div>
    </div>
  )
}
