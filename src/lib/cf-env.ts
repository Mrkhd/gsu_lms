import { env as cloudflareEnv } from "cloudflare:workers"

/**
 * Reads a runtime variable from Cloudflare bindings/secrets, falling back to
 * `process.env` (dotenv) so the app also works under plain Node tooling.
 */
export function readEnv(key: string, fallback?: string): string | undefined {
  const fromBinding = (cloudflareEnv as unknown as Record<string, unknown>)[key]
  if (typeof fromBinding === "string") return fromBinding
  const fromProcess = typeof process !== "undefined" ? process.env[key] : undefined
  return fromProcess ?? fallback
}
