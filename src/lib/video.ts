/** Converts common video URLs (YouTube/Vimeo) into embeddable URLs. */
export function getVideoEmbed(url: string | null | undefined): {
  kind: "iframe" | "file" | "none"
  src: string
} {
  if (!url) return { kind: "none", src: "" }
  const trimmed = url.trim()
  if (!trimmed) return { kind: "none", src: "" }

  // App-hosted media is stored as a relative path (e.g. "/media/lessons/x.mp4").
  if (trimmed.startsWith("/") || trimmed.startsWith("./")) {
    return { kind: "file", src: trimmed.startsWith("/") ? trimmed : `/${trimmed}` }
  }

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed${parsed.pathname}` }
    }
    if (host.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v")
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` }
      if (parsed.pathname.startsWith("/embed/")) return { kind: "iframe", src: trimmed }
    }
    if (host.endsWith("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean)
      const id = segments[0] === "video" ? segments[1] : segments[0]
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` }
    }

    return { kind: "file", src: trimmed }
  } catch {
    // Not an absolute URL — treat it as an app-relative file.
    return { kind: "file", src: trimmed.startsWith("/") ? trimmed : `/${trimmed}` }
  }
}
