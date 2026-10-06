import Link from "next/link"
import { notFound } from "next/navigation"
import { Boxes, CheckCircle2, Clock, Layers } from "lucide-react"

import { StatusBadge } from "@/components/status-badge"
import { Thumbnail } from "@/components/thumbnail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getBundleAccess } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"
import { formatAccessDuration, formatPrice, toNumber } from "@/lib/format"
import { getBundleBySlug } from "@/lib/queries"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await getBundleBySlug(slug)
  return { title: bundle?.title ?? "Bundle" }
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bundle = await getBundleBySlug(slug)

  if (!bundle || (bundle.status !== "PUBLISHED" && bundle.status !== "ARCHIVED")) {
    notFound()
  }

  const user = await getCurrentUser()
  const access = user ? await getBundleAccess(user.id, bundle.id) : null

  const individualValue = bundle.courses.reduce(
    (sum, item) => sum + toNumber(item.course.price),
    0
  )
  const savings = individualValue - toNumber(bundle.price)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Boxes className="size-3" />
                Bundle
              </Badge>
              <StatusBadge status={bundle.status} />
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {bundle.title}
            </h1>
            {bundle.shortDescription ? (
              <p className="text-lg text-muted-foreground">{bundle.shortDescription}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {bundle._count.courses} {bundle._count.courses === 1 ? "course" : "courses"} included
            </p>
          </div>

          <Thumbnail
            src={bundle.thumbnailUrl}
            alt={bundle.title}
            seed={bundle.slug}
            className="aspect-video w-full rounded-xl ring-1 ring-foreground/10"
          />

          {bundle.description ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">About this bundle</h2>
              <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {bundle.description}
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Courses in this bundle</h2>
            <ul className="space-y-3">
              {bundle.courses.map(({ course }) => (
                <li key={course.id}>
                  <Card className="flex-row items-center gap-4 p-3">
                    <Thumbnail
                      src={course.thumbnailUrl}
                      alt={course.title}
                      seed={course.slug}
                      className="size-16 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="font-medium hover:underline"
                      >
                        {course.title}
                      </Link>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {course.shortDescription}
                      </p>
                    </div>
                    <div className="hidden text-right text-sm sm:block">
                      <p className="text-muted-foreground">{formatPrice(course.price)}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Layers className="size-3" />
                        {course._count.lessons}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <span className="font-heading text-3xl font-semibold">
                  {formatPrice(bundle.price)}
                </span>
                {savings > 0 ? (
                  <p className="text-sm">
                    <span className="text-muted-foreground line-through">
                      {formatPrice(individualValue)}
                    </span>{" "}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Save {formatPrice(savings)}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="font-medium">{formatAccessDuration(bundle.accessDurationDays)}</span>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground">
                {bundle.courses.map(({ course }) => (
                  <li key={course.id} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    {course.title}
                  </li>
                ))}
              </ul>

              <Separator />

              {access?.hasAccess ? (
                <Button asChild size="lg" className="w-full">
                  <Link href="/dashboard/bundles">Go to my bundles</Link>
                </Button>
              ) : user ? (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/checkout/bundle/${bundle.slug}`}>
                    {toNumber(bundle.price) <= 0 ? "Get bundle — free" : "Buy bundle"}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/login?next=${encodeURIComponent(`/bundles/${bundle.slug}`)}`}>
                    Sign in to purchase
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
