import Link from "next/link"
import { ArrowRight, BookOpen, Boxes, Clock, ShieldCheck, Sparkles } from "lucide-react"

import { BundleCard } from "@/components/bundle-card"
import { CourseCard } from "@/components/course-card"
import { ProgramCard } from "@/components/program-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getCategories,
  getPublishedBundles,
  getPublishedCourses,
  getPublishedPrograms,
} from "@/lib/queries"

const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: "Focused courses",
    description: "Video, text and PDF lessons organised into clean, easy-to-follow sections.",
  },
  {
    icon: Boxes,
    title: "Money-saving bundles",
    description: "Group related courses and sell them together at a better price.",
  },
  {
    icon: Clock,
    title: "Time-limited access",
    description: "Sell 30-day, 6-month, 12-month or lifetime access — you decide.",
  },
  {
    icon: ShieldCheck,
    title: "Access you can trust",
    description: "Every lesson is protected server-side by real enrollment checks.",
  },
]

export default async function HomePage() {
  const [popular, newest, bundles, categories, programs] = await Promise.all([
    getPublishedCourses({ sort: "popular", pageSize: 3 }),
    getPublishedCourses({ sort: "newest", pageSize: 3 }),
    getPublishedBundles({ pageSize: 3 }),
    getCategories(),
    getPublishedPrograms({ pageSize: 3 }),
  ])

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="w-fit gap-1">
              <Sparkles className="size-3" />
              GSU · Postgraduate School
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Advance your career with GSU postgraduate programs
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Enroll by semester, pay only for the terms you take, and study online with term-based
              access to every course in your program.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/programs">
                  Explore programs
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUE_PROPS.map((prop) => {
              const Icon = prop.icon
              return (
                <div key={prop.title} className="rounded-xl border bg-card p-5">
                  <Icon className="mb-3 size-5 text-primary" />
                  <p className="font-medium">{prop.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{prop.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="border-b">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-6">
            <span className="text-sm font-medium text-muted-foreground">Browse by topic:</span>
            {categories.map((category) => (
              <Button key={category.id} asChild variant="outline" size="sm">
                <Link href={`/courses?category=${category.slug}`}>{category.name}</Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {programs.items.length > 0 ? (
        <section className="border-b bg-muted/30">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14">
            <SectionHeading
              title="Degree programs"
              description="Four-semester programs — pay per semester, only for the terms you take."
              href="/programs"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programs.items.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14">
        <SectionHeading
          title="Popular courses"
          description="The courses students are enrolling in the most."
          href="/courses?sort=popular"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        {popular.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published courses yet.</p>
        ) : null}
      </section>

      {bundles.items.length > 0 ? (
        <section className="border-y bg-muted/30">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14">
            <SectionHeading
              title="Save with bundles"
              description="Get several courses together for a better price."
              href="/bundles"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.items.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14">
        <SectionHeading
          title="Newest courses"
          description="Freshly published learning paths."
          href="/courses"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newest.items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
            Ready to enroll at GSU Postgraduate?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Create your account, choose your program and pay per semester to begin.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/register">
              Create an account
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({
  title,
  description,
  href,
}: {
  title: string
  description?: string
  href?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {href ? (
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>
            View all
            <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
