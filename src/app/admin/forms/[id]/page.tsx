import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, Inbox } from "lucide-react"

import { FormBuilder } from "@/components/admin/form-builder"
import { FormResponseDialog } from "@/components/admin/form-response-dialog"
import { PageHeader } from "@/components/dashboard-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireAdmin } from "@/lib/auth/server"
import { formatDate, initials } from "@/lib/format"
import { getFormById, getFormSubmissions } from "@/lib/queries"

export const metadata = { title: "Edit form" }

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [form, responses] = await Promise.all([getFormById(id), getFormSubmissions(id)])
  if (!form) notFound()

  return (
    <div>
      <PageHeader
        title={form.title}
        description="Edit the form and review responses."
        actions={
          form.status === "PUBLISHED" ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/forms/${form.slug}`} target="_blank">
                <ExternalLink />
                Open public form
              </Link>
            </Button>
          ) : null
        }
      />

      <FormBuilder
        mode="edit"
        form={{
          id: form.id,
          title: form.title,
          slug: form.slug,
          description: form.description,
          status: form.status,
          fields: form.fields,
        }}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Responses ({responses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length > 0 ? (
            <div className="overflow-hidden rounded-xl border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Respondent</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarFallback>
                              {initials(response.name, undefined, response.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{response.name}</p>
                            <p className="text-xs text-muted-foreground">{response.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(response.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <FormResponseDialog
                            title={form.title}
                            fields={form.fields}
                            response={{
                              name: response.name,
                              email: response.email,
                              createdAt: response.createdAt,
                              answers: response.answers,
                            }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Inbox className="size-4" />
              No responses yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
