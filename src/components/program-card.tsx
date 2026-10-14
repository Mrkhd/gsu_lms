import Link from "next/link"
import { School } from "lucide-react"


import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Thumbnail } from "@/components/thumbnail"


type ProgramCardProgram = {
  slug: string
  title: string
  code?: string | null
  shortDescription?: string | null
  thumbnailUrl?: string | null
  level: string
  semesterCount: number
}

export function ProgramCard({ program }: { program: ProgramCardProgram }) {
  return (
    <Card className="h-full gap-0 pt-0 transition-shadow hover:ring-foreground/20">
      <Link href={`/programs/${program.slug}`} className="block">
        <Thumbnail
          src={program.thumbnailUrl}
          alt={program.title}
          seed={program.slug}
          className="aspect-video w-full"
        />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {program.code ? <Badge variant="secondary">{program.code}</Badge> : null}
          <Badge variant="outline">{program.level}</Badge>
        </div>
        <Link href={`/programs/${program.slug}`} className="group">
          <h3 className="font-heading line-clamp-2 text-base font-semibold group-hover:underline">
            {program.title}
          </h3>
        </Link>
        {program.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{program.shortDescription}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <School className="size-3.5" />
            {program.semesterCount} semesters
          </span>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          href={`/programs/${program.slug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View program
        </Link>
      </CardFooter>
    </Card>
  )
}
