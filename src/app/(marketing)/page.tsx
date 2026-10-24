import Link from "next/link"
import { ArrowRight, Download, GraduationCap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Postgraduate Programs" }

const DEPARTMENTS = [
  {
    faculty: "Health Sciences",
    title: "Master of Science in Public Health",
    description:
      "Master the complexities of global health systems, epidemiology, and healthcare policy through rigorous academic research.",
  },
  {
    faculty: "Information Technology",
    title: "Master of Computer Science",
    description:
      "Advanced computational theory, artificial intelligence, and software engineering for the next generation of tech leaders.",
  },
  {
    faculty: "Engineering & Environment",
    title: "Master of Water Resources Management",
    description:
      "Develop sustainable solutions for global water challenges through integrated management and environmental science.",
  },
  {
    faculty: "Architecture & Construction",
    title: "Master of Construction Management",
    description:
      "Leading complex projects from inception to completion with focus on economics, safety, and modern logistics.",
  },
  {
    faculty: "Business & Finance",
    title: "Master of Accounting",
    description:
      "Advanced financial reporting, auditing, and corporate governance for high-level financial leadership roles.",
  },
  {
    faculty: "Healthcare Administration",
    title: "Master of Business Administration in Health Care Management",
    description:
      "Navigating the intersection of medicine and business to lead hospitals and healthcare networks efficiently.",
  },
  {
    faculty: "Management",
    title: "Master of Business Administration in Project Management",
    description:
      "Master agile and traditional project methodologies to lead cross-functional teams in diverse industry sectors.",
  },
  {
    faculty: "Social Sciences",
    title: "Master of Education",
    description:
      "Shaping future pedagogies and educational leadership through research-based practice and instructional design.",
  },
  {
    faculty: "Political Science",
    title: "Master of International Relations and Arid Policies",
    description:
      "Analyze global politics, diplomacy, and international law to prepare for careers in government and NGOs.",
  },
  {
    faculty: "Business Administration",
    title: "Master of Business Administration",
    description:
      "A comprehensive management education for professionals looking to transition into executive leadership roles.",
  },
  {
    faculty: "General",
    title: "Climate change and Environmental sustainability",
    description: "Advanced postgraduate program designed to develop expertise in this field.",
  },
  {
    faculty: "General",
    title: "Nutrition",
    description: "Advanced postgraduate program designed to develop expertise in this field.",
  },
]

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            <GraduationCap className="size-3.5" />
            In collaboration with Lincoln University College, Malaysia
          </Badge>
          <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Postgraduate Programs
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Explore our range of master&apos;s and doctoral programs designed to advance your
            professional career and research expertise.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Apply Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/gsu-brochure.pdf" download>
                <Download className="size-4" />
                Download Brochure
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="border-y bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            University
          </Link>
          <span>/</span>
          <span>Academics</span>
          <span>/</span>
          <span className="font-medium text-foreground">Postgraduate Programs</span>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-heading text-3xl font-bold tracking-tight">Faculty Departments</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((department, index) => (
            <article
              key={`${department.faculty}-${index}`}
              className="flex flex-col rounded-2xl border bg-card p-6 text-card-foreground transition-colors hover:border-primary/40"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                🎓
              </div>
              <p className="mt-4 text-xs font-semibold tracking-wide text-primary uppercase">
                {department.faculty}
              </p>
              <h3 className="mt-1 font-heading text-lg leading-snug font-semibold">
                {department.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Offered in collaboration with Lincoln University College
              </p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{department.description}</p>
              <Link
                href="/programs"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Learn More
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Ready to Begin Your Journey?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/80">
            Join hundreds of postgraduate students at Galmudug State University. Applications for the
            next intake are now open.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Apply Online Today</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="mailto:info@galmudugsu.edu.so">Request More Information</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
