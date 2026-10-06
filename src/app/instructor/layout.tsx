import { DashboardShell } from "@/components/dashboard-shell"
import { requireInstructor } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireInstructor()
  return (
    <DashboardShell user={user} variant="instructor">
      {children}
    </DashboardShell>
  )
}
