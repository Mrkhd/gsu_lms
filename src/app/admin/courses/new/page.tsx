import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CourseForm } from "@/components/admin/course-form"
import { PageHeader } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { getCategoryOptions, getInstructorOptions } from "@/db/options"
import { requireAdmin } from "@/lib/auth/server"

export const metadata = { title: "New course" }

export default async function NewCoursePage() {
  await requireAdmin()
  const [categories, instructors] = await Promise.all([
    getCategoryOptions(),
    getInstructorOptions(),
  ])

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/courses">
          <ArrowLeft />
          Back to courses
        </Link>
      </Button>
      <PageHeader title="New course" description="Set up the basics, then build the curriculum." />
      <CourseForm
        mode="create"
        canAssignInstructor
        defaultValues={{
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          thumbnailUrl: "",
          categoryId: "",
          instructorId: instructors[0]?.id ?? "",
          level: "BEGINNER",
          price: "0",
          accessDurationDays: "180",
          status: "DRAFT",
          whatYouLearn: "",
          requirements: "",
        }}
        categories={categories}
        instructors={instructors.map((instructor) => ({
          id: instructor.id,
          name:
            [instructor.profile?.firstName, instructor.profile?.lastName].filter(Boolean).join(" ") ||
            instructor.email,
        }))}
      />
    </div>
  )
}
