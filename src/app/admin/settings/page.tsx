import { CreditCard, Clock, Database } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { env } from "@/lib/env"
import { getPaymentProvider } from "@/lib/payments"

export const metadata = { title: "Settings" }

export default function SettingsPage() {
  const provider = getPaymentProvider()

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration for this MVP."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <CardTitle>Payments</CardTitle>
            </div>
            <CardDescription>
              Payments are abstracted behind a provider interface. Swap providers without touching
              the rest of the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active provider</span>
              <StatusBadge status={provider.name.toUpperCase()} />
            </div>
            <p className="text-muted-foreground">
              Set <code className="rounded bg-muted px-1">PAYMENT_PROVIDER</code> in your environment
              to change it. The mock provider approves checkouts instantly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <CardTitle>Access durations</CardTitle>
            </div>
            <CardDescription>
              Available windows when creating courses and bundles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {ACCESS_DURATION_PRESETS.map((preset) => (
                <li
                  key={preset.label}
                  className="rounded-lg border px-3 py-1 text-sm text-muted-foreground"
                >
                  {preset.label}
                </li>
              ))}
              <li className="rounded-lg border px-3 py-1 text-sm text-muted-foreground">Custom</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" />
              <CardTitle>Environment</CardTitle>
            </div>
            <CardDescription>Read-only overview of the running configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span>{env.NODE_ENV}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">App URL</span>
              <span>{env.NEXT_PUBLIC_APP_URL}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="max-w-72 truncate">Cloudflare D1 (binding DB)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Storage</span>
              <span className="max-w-72 truncate">Cloudflare R2 (binding BUCKET)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
