import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const QUICK_LINKS = [
  { label: "About Us", href: "/" },
  { label: "Apply Now", href: "/register" },
  { label: "Research", href: "/programs" },
  { label: "Upcoming Events", href: "/" },
  { label: "Blog & News", href: "/" },
]

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const SOCIALS = [
  { label: "Facebook", icon: FacebookIcon },
  { label: "X", icon: XIcon },
  { label: "YouTube", icon: YoutubeIcon },
]

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-heading text-lg font-semibold">Galmudug State University (GSU)</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Galmudug State University (GSU) is a prestigious institution situated in Galmudug State,
            within the Federal Republic of Somalia. Established in 2014, the university owes its
            inception to the generous support of the UK DFID grant, which was awarded through Comic
            Relief. This grant aimed to enhance education and foster development in Central Somalia.
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => {
              const Icon = social.icon
              return (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon />
                </a>
              )
            })}
          </div>
          <div className="flex max-w-sm items-center gap-2">
            <Input type="email" placeholder="sample@mail.com" />
            <Button className="shrink-0">Subscribe</Button>
          </div>
        </div>

        <div>
          <p className="font-heading font-semibold">Quick Links</p>
          <ul className="mt-4 space-y-2 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-heading font-semibold">Contact Details</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0" />
              <a href="mailto:info@galmudugsu.edu.so" className="hover:text-primary">
                info@galmudugsu.edu.so
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <a href="tel:+252614553336" className="hover:text-primary">
                +252 614553336
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              Adado District, Galmudug State, Somalia
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Galmudug State University (GSU). All rights reserved.
      </div>
    </footer>
  )
}
