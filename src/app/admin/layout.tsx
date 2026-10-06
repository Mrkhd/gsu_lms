import { DashboardShell } from "@/components/dashboard-shell"
import { requireAdmin } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <DashboardShell user={user} variant="admin">
      {children}
    </DashboardShell>
  )
}
