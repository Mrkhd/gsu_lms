import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { BundleForm } from "@/components/admin/bundle-form"
import { PageHeader } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { getCourseOptions } from "@/db/options"
import { requireAdmin } from "@/lib/auth/server"
import { toNumber } from "@/lib/format"

export const metadata = { title: "New bundle" }

export default async function NewBundlePage() {
  await requireAdmin()
  const courses = await getCourseOptions()

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/bundles">
          <ArrowLeft />
          Back to bundles
        </Link>
      </Button>
      <PageHeader title="Create bundle" description="Choose courses and set a bundle price." />
      <BundleForm
        mode="create"
        defaultValues={{
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          thumbnailUrl: "",
          price: "0",
          accessDurationDays: "180",
          status: "DRAFT",
          courseIds: [],
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
