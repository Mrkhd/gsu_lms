import { env } from "cloudflare:workers"
import type { R2Bucket } from "@cloudflare/workers-types"

export type UploadBody = Parameters<R2Bucket["put"]>[1]

/** Stores an object in the R2 bucket and returns its key. */
export async function putObject(
  key: string,
  body: UploadBody,
  options?: { contentType?: string }
): Promise<string> {
  await env.BUCKET.put(key, body, {
    httpMetadata: options?.contentType ? { contentType: options.contentType } : undefined,
  })
  return key
}

export async function deleteObject(key: string): Promise<void> {
  await env.BUCKET.delete(key)
}

export function getObject(key: string) {
  return env.BUCKET.get(key)
}

/** Builds a stable, collision-resistant key such as `lessons/<uuid>-intro.mp4`. */
export function mediaKey(prefix: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `${prefix}/${crypto.randomUUID()}-${safe}`
}

/** URL served by the authenticated media route (`/media/[...key]`). */
export function mediaUrl(key: string): string {
  return `/media/${key}`
}
