import Link from "next/link"
import { Boxes } from "lucide-react"


import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Thumbnail } from "@/components/thumbnail"
import { formatPrice, toNumber } from "@/lib/format"

type BundleCardBundle = {
  slug: string
  title: string
  shortDescription?: string | null
  thumbnailUrl?: string | null
  price: number | string
  _count?: { courses?: number }
  courses?: { course: { price: number | string } }[]
}

export function BundleCard({ bundle, href }: { bundle: BundleCardBundle; href?: string }) {
  const courseCount = bundle._count?.courses ?? bundle.courses?.length ?? 0
  const individualValue = (bundle.courses ?? []).reduce(
    (sum, item) => sum + toNumber(item.course.price),
    0
  )
  const showValue = individualValue > toNumber(bundle.price)

  return (
    <Card className="h-full gap-0 pt-0 transition-shadow hover:ring-foreground/20">
      <Link href={href ?? `/bundles/${bundle.slug}`} className="block">
        <Thumbnail
          src={bundle.thumbnailUrl}
          alt={bundle.title}
          seed={bundle.slug}
          className="aspect-video w-full"
        />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        <Badge variant="secondary" className="w-fit">
          <Boxes className="size-3" />
          {courseCount} {courseCount === 1 ? "course" : "courses"}
        </Badge>
        <Link href={href ?? `/bundles/${bundle.slug}`} className="group">
          <h3 className="font-heading line-clamp-2 text-base font-semibold group-hover:underline">
            {bundle.title}
          </h3>
        </Link>
        {bundle.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{bundle.shortDescription}</p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-base font-semibold">{formatPrice(bundle.price)}</span>
          {showValue ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(individualValue)}
            </span>
          ) : null}
        </div>
        <Link
          href={href ?? `/bundles/${bundle.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View bundle
        </Link>
      </CardFooter>
    </Card>
  )
}
