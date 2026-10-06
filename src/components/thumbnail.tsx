import { cn } from "@/lib/utils"

const GRADIENTS = [
  "from-sky-500/20 to-indigo-500/20 text-sky-700 dark:text-sky-300",
  "from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300",
  "from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300",
  "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-700 dark:text-fuchsia-300",
  "from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300",
]

function pickGradient(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 100000
  return GRADIENTS[hash % GRADIENTS.length]
}

export function Thumbnail({
  src,
  alt,
  seed,
  className,
  imgClassName,
}: {
  src?: string | null
  alt: string
  seed: string
  className?: string
  imgClassName?: string
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={cn("size-full object-cover", imgClassName)} />
      </div>
    )
  }

  const initial = alt.trim().charAt(0).toUpperCase() || "L"
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br",
        pickGradient(seed),
        className
      )}
      aria-hidden
    >
      <span className="font-heading text-3xl font-semibold">{initial}</span>
    </div>
  )
}
