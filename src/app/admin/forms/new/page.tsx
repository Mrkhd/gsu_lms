import { FormBuilder } from "@/components/admin/form-builder"
import { PageHeader } from "@/components/dashboard-shell"
import { requireAdmin } from "@/lib/auth/server"

export const metadata = { title: "New form" }

export default async function NewFormPage() {
  await requireAdmin()

  return (
    <div>
      <PageHeader
        title="New form"
        description="Add fields, then publish to start collecting responses."
      />
      <FormBuilder mode="create" />
    </div>
  )
}
