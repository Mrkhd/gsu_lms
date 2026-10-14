import { notFound } from "next/navigation"

import { PublicForm } from "@/components/public-form"
import { getFormBySlug } from "@/lib/queries"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getFormBySlug(slug)
  return { title: form?.title ?? "Form" }
}

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await getFormBySlug(slug)
  if (!form) notFound()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <PublicForm
        formId={form.id}
        title={form.title}
        description={form.description}
        fields={form.fields}
      />
    </div>
  )
}
