/** Converts common video URLs (YouTube/Vimeo) into embeddable URLs. */
export function getVideoEmbed(url: string | null | undefined): { kind: "iframe" | "file" | "none"; src: string } {
  if (!url) return { kind: "none", src: "" }

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed${parsed.pathname}` }
    }
    if (host.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v")
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` }
      if (parsed.pathname.startsWith("/embed/")) return { kind: "iframe", src: url }
    }
    if (host.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0]
      if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` }
    }
  } catch {
    return { kind: "none", src: "" }
  }

  return { kind: "file", src: url }
}
