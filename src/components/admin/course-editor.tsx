import Link from "next/link"
import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { Users } from "lucide-react"

import { ActionButton } from "@/components/action-button"
import { CourseForm } from "@/components/admin/course-form"
import { CurriculumBuilder } from "@/components/admin/curriculum-builder"
import { PageHeader } from "@/components/dashboard-shell"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDb } from "@/db/client"
import { courses } from "@/db/schema"
import { getCategoryOptions, getInstructorOptions } from "@/db/options"
import { toNumber } from "@/lib/format"
import { canManageCourse, getCurrentUser } from "@/lib/auth/server"
import { setCourseStatusAction } from "@/server/actions/courses"

export async function CourseEditor({
  courseId,
  viewerRole,
}: {
  courseId: string
  viewerRole: "ADMIN" | "INSTRUCTOR"
}) {
  const user = await getCurrentUser()
  if (!user) notFound()

  const db = getDb()
  const [course, categories, instructors] = await Promise.all([
    db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        sections: {
          with: { lessons: true },
          orderBy: (s, { asc: a }) => [a(s.position)],
        },
      },
    }),
    getCategoryOptions(),
    getInstructorOptions(),
  ])

  if (!course) notFound()
  if (!canManageCourse(user, course)) notFound()

  const basePath = viewerRole === "ADMIN" ? "/admin" : "/instructor"

  const instructorOptions = instructors.map((instructor) => ({
    id: instructor.id,
    name:
      [instructor.profile?.firstName, instructor.profile?.lastName].filter(Boolean).join(" ") ||
      instructor.email,
  }))

  return (
    <div className="space-y-8">
      <PageHeader
        title={course.title}
        description="Manage course details and curriculum."
        actions={
          <>
            <StatusBadge status={course.status} />
            <Button asChild variant="outline" size="sm">
              <Link href={`${basePath}/courses/${course.id}/students`}>
                <Users />
                Students
              </Link>
            </Button>
            {viewerRole === "ADMIN" ? (
              course.status === "PUBLISHED" ? (
                <ActionButton
                  size="sm"
                  variant="outline"
                  action={setCourseStatusAction.bind(null, course.id, "DRAFT")}
                >
                  Unpublish
                </ActionButton>
              ) : (
                <ActionButton
                  size="sm"
                  action={setCourseStatusAction.bind(null, course.id, "PUBLISHED")}
                >
                  Publish
                </ActionButton>
              )
            ) : course.status !== "PUBLISHED" ? (
              <ActionButton
                size="sm"
                action={setCourseStatusAction.bind(null, course.id, "PUBLISHED")}
              >
                Publish
              </ActionButton>
            ) : null}
          </>
        }
      />

      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="basic">Basic info</TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="space-y-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Curriculum</h2>
            <p className="text-sm text-muted-foreground">
              Drag to reorder sections and lessons. Changes save automatically.
            </p>
          </div>
          <CurriculumBuilder
            key={course.sections
              .map(
                (section) => `${section.id}[${section.lessons.map((lesson) => lesson.id).join(",")}]`
              )
              .join("|")}
            courseId={course.id}
            sections={course.sections.map((section) => ({
              id: section.id,
              title: section.title,
              lessons: section.lessons.map((lesson) => ({
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                videoUrl: lesson.videoUrl,
                content: lesson.content,
                pdfUrl: lesson.pdfUrl,
                durationMinutes: lesson.durationMinutes,
                isPreview: lesson.isPreview,
              })),
            }))}
          />
        </TabsContent>

        <TabsContent value="basic">
          <CourseForm
            mode="edit"
            courseId={course.id}
            canAssignInstructor={viewerRole === "ADMIN"}
            defaultValues={{
              title: course.title,
              slug: course.slug,
              shortDescription: course.shortDescription ?? "",
              description: course.description ?? "",
              thumbnailUrl: course.thumbnailUrl ?? "",
              categoryId: course.categoryId ?? "",
              instructorId: course.instructorId,
              level: course.level,
              price: String(toNumber(course.price)),
              accessDurationDays:
                course.accessDurationDays === null
                  ? "lifetime"
                  : String(course.accessDurationDays),
              status: course.status,
              whatYouLearn: course.whatYouLearn.join("\n"),
              requirements: course.requirements.join("\n"),
            }}
            categories={categories}
            instructors={instructorOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
