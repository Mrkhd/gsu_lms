import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { ProgramForm } from "@/components/admin/program-form"
import { PageHeader } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { getDb } from "@/db/client"
import { getBundleOptions } from "@/db/options"
import { programs } from "@/db/schema"
import { requireAdmin } from "@/lib/auth/server"
import { toNumber } from "@/lib/format"
import { setProgramStatusAction } from "@/server/actions/programs"

export const metadata = { title: "Edit program" }

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const db = getDb()
  const [program, bundles] = await Promise.all([
    db.query.programs.findFirst({
      where: eq(programs.id, id),
      with: { semesters: { orderBy: (s, { asc: a }) => [a(s.number)] } },
    }),
    getBundleOptions(),
  ])

  if (!program) notFound()

  const defaultSemesters: Record<number, { bundleId: string; title: string }> = {}
  for (const semester of program.semesters) {
    defaultSemesters[semester.number] = { bundleId: semester.bundleId, title: semester.title }
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/programs">
          <ArrowLeft />
          Back to programs
        </Link>
      </Button>
      <PageHeader
        title={program.title}
        description="Manage program details and semester mapping."
        actions={
          <>
            <StatusBadge status={program.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/programs/${program.slug}`} target="_blank">
                <ExternalLink />
                View public page
              </Link>
            </Button>
            <ActionButton
              size="sm"
              variant={program.status === "PUBLISHED" ? "outline" : "default"}
              action={setProgramStatusAction.bind(
                null,
                program.id,
                program.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"
              )}
            >
              {program.status === "PUBLISHED" ? "Unpublish" : "Publish"}
            </ActionButton>
          </>
        }
      />
      <ProgramForm
        mode="edit"
        programId={program.id}
        defaultValues={{
          title: program.title,
          slug: program.slug,
          code: program.code ?? "",
          shortDescription: program.shortDescription ?? "",
          description: program.description ?? "",
          thumbnailUrl: program.thumbnailUrl ?? "",
          level: program.level,
          semesterCount: String(program.semesterCount),
          accessDurationDays:
            program.accessDurationDays === null ? "lifetime" : String(program.accessDurationDays),
          status: program.status,
        }}
        defaultSemesters={defaultSemesters}
        bundles={bundles.map((bundle) => ({
          id: bundle.id,
          title: bundle.title,
          price: toNumber(bundle.price),
        }))}
      />
    </div>
  )
}
