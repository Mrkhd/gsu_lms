import Link from "next/link"
import { Layers, User } from "lucide-react"


import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Thumbnail } from "@/components/thumbnail"
import { formatPrice, fullName } from "@/lib/format"

type CourseCardCourse = {
  slug: string
  title: string
  shortDescription?: string | null
  thumbnailUrl?: string | null
  price: number | string
  level?: string | null
  category?: { name: string } | null
  instructor?: { profile?: { firstName: string | null; lastName: string | null } | null } | null
  _count?: { lessons?: number }
}

export function CourseCard({ course, href }: { course: CourseCardCourse; href?: string }) {
  const lessonCount = course._count?.lessons ?? 0
  return (
    <Card className="h-full gap-0 pt-0 transition-shadow hover:ring-foreground/20">
      <Link href={href ?? `/courses/${course.slug}`} className="block">
        <Thumbnail
          src={course.thumbnailUrl}
          alt={course.title}
          seed={course.slug}
          className="aspect-video w-full"
        />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        <div className="flex items-center gap-2">
          {course.category ? (
            <Badge variant="secondary">{course.category.name}</Badge>
          ) : null}
          {course.level ? <Badge variant="outline">{course.level.toLowerCase()}</Badge> : null}
        </div>
        <Link href={href ?? `/courses/${course.slug}`} className="group">
          <h3 className="font-heading line-clamp-2 text-base font-semibold group-hover:underline">
            {course.title}
          </h3>
        </Link>
        {course.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5" />
            {fullName(course.instructor?.profile, "Instructor")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" />
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="font-heading text-base font-semibold">{formatPrice(course.price)}</span>
        <Link
          href={href ?? `/courses/${course.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View course
        </Link>
      </CardFooter>
    </Card>
  )
}
