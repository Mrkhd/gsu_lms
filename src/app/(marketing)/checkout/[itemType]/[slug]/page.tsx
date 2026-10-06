import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Clock, Lock } from "lucide-react"

import { CheckoutButton } from "@/components/checkout-button"
import { Thumbnail } from "@/components/thumbnail"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { and, count, eq } from "drizzle-orm"

import { getDb } from "@/db/client"
import { bundleCourses, bundles, courses, lessons } from "@/db/schema"
import { getBundleAccess, getCourseAccess } from "@/lib/access"
import { getCurrentUser } from "@/lib/auth/server"
import { formatAccessDuration, formatPrice, toNumber } from "@/lib/format"

export const metadata = { title: "Checkout" }

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ itemType: string; slug: string }>
}) {
  const { itemType, slug } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/${itemType}/${slug}`)}`)

  if (itemType !== "course" && itemType !== "bundle") notFound()

  const db = getDb()

  type Product = {
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
    shortDescription: string | null
    price: number
    accessDurationDays: number | null
    _count: { lessons?: number; courses?: number }
  }
  let product: Product | null = null

  if (itemType === "course") {
    const [course] = await db
      .select()
      .from(courses)
      .where(and(eq(courses.slug, slug), eq(courses.status, "PUBLISHED")))
      .limit(1)
    if (course) {
      const [lessonCount] = await db
        .select({ value: count() })
        .from(lessons)
        .where(eq(lessons.courseId, course.id))
      product = {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnailUrl,
        shortDescription: course.shortDescription,
        price: course.price,
        accessDurationDays: course.accessDurationDays,
        _count: { lessons: Number(lessonCount?.value ?? 0) },
      }
    }
  } else {
    const [bundle] = await db
      .select()
      .from(bundles)
      .where(and(eq(bundles.slug, slug), eq(bundles.status, "PUBLISHED")))
      .limit(1)
    if (bundle) {
      const [courseCount] = await db
        .select({ value: count() })
        .from(bundleCourses)
        .where(eq(bundleCourses.bundleId, bundle.id))
      product = {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        thumbnailUrl: bundle.thumbnailUrl,
        shortDescription: bundle.shortDescription,
        price: bundle.price,
        accessDurationDays: bundle.accessDurationDays,
        _count: { courses: Number(courseCount?.value ?? 0) },
      }
    }
  }

  if (!product) notFound()

  const access =
    itemType === "course"
      ? await getCourseAccess(user.id, product.id)
      : await getBundleAccess(user.id, product.id)

  if (access.hasAccess) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>You already have access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You already own <strong>{product.title}</strong>. Head to your dashboard to start
              learning.
            </p>
            <Button asChild>
              <Link href={itemType === "course" ? `/learn/${product.slug}` : "/dashboard/bundles"}>
                Go to {itemType === "course" ? "course" : "bundles"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const price = toNumber(product.price)
  const isFree = price <= 0

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Thumbnail
              src={product.thumbnailUrl}
              alt={product.title}
              seed={product.slug}
              className="size-16 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className="font-medium">{product.title}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {product.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
            <Clock className="size-4 text-muted-foreground" />
            {formatAccessDuration(product.accessDurationDays)}
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(product.price)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>{formatPrice(0)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(product.price)}</dd>
            </div>
          </dl>

          <CheckoutButton
            itemType={itemType === "course" ? "COURSE" : "BUNDLE"}
            itemId={product.id}
            label={isFree ? "Confirm free enrollment" : `Pay ${formatPrice(product.price)}`}
            className="w-full"
          />

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            Payments are processed through an abstracted payment provider.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
