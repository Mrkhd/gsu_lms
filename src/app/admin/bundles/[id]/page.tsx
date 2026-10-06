import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { BundleForm } from "@/components/admin/bundle-form"
import { PageHeader } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { getDb } from "@/db/client"
import { getCourseOptions } from "@/db/options"
import { bundles } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/server"
import { toNumber } from "@/lib/format"
import { setBundleStatusAction } from "@/server/actions/bundles"

export const metadata = { title: "Edit bundle" }

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const db = getDb()
  const [bundle, courses] = await Promise.all([
    db.query.bundles.findFirst({
      where: eq(bundles.id, id),
      with: { courses: { orderBy: (c, { asc: a }) => [a(c.position)] } },
    }),
    getCourseOptions(),
  ])

  if (!bundle) notFound()

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/bundles">
          <ArrowLeft />
          Back to bundles
        </Link>
      </Button>
      <PageHeader
        title={bundle.title}
        description="Update bundle details, courses and pricing."
        actions={
          <>
            <StatusBadge status={bundle.status} />
            <ActionButton
              size="sm"
              variant="outline"
              action={setBundleStatusAction.bind(
                null,
                bundle.id,
                bundle.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
              )}
            >
              {bundle.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </ActionButton>
          </>
        }
      />
      <BundleForm
        mode="edit"
        bundleId={bundle.id}
        defaultValues={{
          title: bundle.title,
          slug: bundle.slug,
          shortDescription: bundle.shortDescription ?? "",
          description: bundle.description ?? "",
          thumbnailUrl: bundle.thumbnailUrl ?? "",
          price: String(toNumber(bundle.price)),
          accessDurationDays:
            bundle.accessDurationDays === null ? "lifetime" : String(bundle.accessDurationDays),
          status: bundle.status,
          courseIds: bundle.courses.map((link) => link.courseId),
        }}
        courses={courses.map((course) => ({
          id: course.id,
          title: course.title,
          price: toNumber(course.price),
        }))}
      />
    </div>
  )
}
