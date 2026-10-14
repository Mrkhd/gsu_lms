import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { ProgramForm } from "@/components/admin/program-form"
import { PageHeader } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { getBundleOptions } from "@/db/options"
import { requireAdmin } from "@/lib/auth/server"

export const metadata = { title: "New program" }

export default async function NewProgramPage() {
  await requireAdmin()
  const bundles = await getBundleOptions()

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/programs">
          <ArrowLeft />
          Back to programs
        </Link>
      </Button>
      <PageHeader
        title="New program"
        description="Set up the degree and map its semesters to course packages."
      />
      <ProgramForm
        mode="create"
        defaultValues={{
          title: "",
          slug: "",
          code: "",
          shortDescription: "",
          description: "",
          thumbnailUrl: "",
          level: "Bachelor",
          semesterCount: "4",
          accessDurationDays: "120",
          status: "DRAFT",
        }}
        defaultSemesters={{}}
        bundles={bundles.map((bundle) => ({ id: bundle.id, title: bundle.title }))}
      />
    </div>
  )
}
