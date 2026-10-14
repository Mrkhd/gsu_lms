import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPublishedForms } from "@/lib/queries"

export const metadata = { title: "Forms" }

export default async function PublicFormsPage() {
  const forms = await getPublishedForms()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Forms</h1>
        <p className="text-muted-foreground">Open forms you can fill in without signing in.</p>
      </div>

      {forms.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <Link key={form.id} href={`/forms/${form.slug}`} className="block">
              <Card className="h-full transition-shadow hover:ring-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{form.title}</CardTitle>
                </CardHeader>
                {form.description ? (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{form.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No forms available"
          description="There are no open forms right now. Please check back later."
        />
      )}
    </div>
  )
}
