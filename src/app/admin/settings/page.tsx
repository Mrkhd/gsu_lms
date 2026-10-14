import { Clock, Database } from "lucide-react"

import { PageHeader } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ACCESS_DURATION_PRESETS } from "@/lib/constants"
import { env } from "@/lib/env"

export const metadata = { title: "Settings" }

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Platform configuration." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <CardTitle>Access durations</CardTitle>
            </div>
            <CardDescription>Available windows when creating courses and semesters.</CardDescription>
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

        <Card>
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
