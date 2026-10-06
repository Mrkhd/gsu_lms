import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CourseForm } from "@/components/admin/course-form"
import { PageHeader } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { getCategoryOptions } from "@/db/options"
import { requireInstructor } from "@/lib/auth/server"

export const metadata = { title: "New course" }

export default async function NewInstructorCoursePage() {
  await requireInstructor()
  const categories = await getCategoryOptions()

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/instructor/courses">
          <ArrowLeft />
          Back to my courses
        </Link>
      </Button>
      <PageHeader title="New course" description="Set up the basics, then build the curriculum." />
      <CourseForm
        mode="create"
        canAssignInstructor={false}
        defaultValues={{
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          thumbnailUrl: "",
          categoryId: "",
          instructorId: "",
          level: "BEGINNER",
          price: "0",
          accessDurationDays: "180",
          status: "DRAFT",
          whatYouLearn: "",
          requirements: "",
        }}
        categories={categories}
        instructors={[]}
      />
    </div>
  )
}
