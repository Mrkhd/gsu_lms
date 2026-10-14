import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { dirname, extname, normalize, resolve, sep } from "node:path"

export type UploadBody = ArrayBuffer | ArrayBufferView | string | Blob

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain",
  ".json": "application/json",
}

export function resolveMediaDir(): string {
  return resolve(process.env.MEDIA_DIR ?? "./data/media")
}

function resolveKeyPath(key: string) {
  const base = resolveMediaDir()
  const safeKey = normalize(key).replace(/^([.]{1,2}[/\\])+/, "")
  const target = resolve(base, safeKey)
  if (target !== base && !target.startsWith(base + sep)) {
    throw new Error("Invalid media key")
  }
  return target
}

function metaPath(filePath: string) {
  return `${filePath}.meta.json`
}

async function toBuffer(body: UploadBody): Promise<Buffer> {
  if (typeof body === "string") return Buffer.from(body)
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength)
  }
  return Buffer.from(await body.arrayBuffer())
}

/** Stores an object on disk and returns its key. */
export async function putObject(
  key: string,
  body: UploadBody,
  options?: { contentType?: string }
): Promise<string> {
  const filePath = resolveKeyPath(key)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, await toBuffer(body))
  writeFileSync(metaPath(filePath), JSON.stringify({ contentType: options?.contentType ?? null }))
  return key
}

export async function deleteObject(key: string): Promise<void> {
  const filePath = resolveKeyPath(key)
  for (const target of [filePath, metaPath(filePath)]) {
    try {
      unlinkSync(target)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
    }
  }
}

export type StoredObject = {
  body: Uint8Array
  contentType: string
  etag: string
  size: number
}

export async function getObject(key: string): Promise<StoredObject | null> {
  const filePath = resolveKeyPath(key)
  if (!existsSync(filePath)) return null

  const stats = statSync(filePath)
  const body = readFileSync(filePath)

  let contentType = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream"
  try {
    const meta = JSON.parse(readFileSync(metaPath(filePath), "utf8")) as { contentType?: string | null }
    if (meta?.contentType) contentType = meta.contentType
  } catch {
    // sidecar missing or malformed — fall back to extension mapping
  }

  return {
    body,
    contentType,
    etag: `"${stats.size}-${Math.floor(stats.mtimeMs)}"`,
    size: stats.size,
  }
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
