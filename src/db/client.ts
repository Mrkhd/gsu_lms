import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

import * as schema from "./schema"

export function createDb(path: string) {
  if (path !== ":memory:") {
    const dir = dirname(path)
    if (dir && dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
  const sqlite = new Database(path)
  sqlite.pragma("journal_mode = WAL")
  sqlite.pragma("foreign_keys = ON")
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>

export function resolveDatabasePath(): string {
  return process.env.DATABASE_PATH ?? "./data/lms.db"
}

let cached: Db | null = null

/**
 * Returns a singleton Drizzle client backed by a local SQLite file.
 * Safe to call per request; the connection is created once per process.
 */
export function getDb(): Db {
  if (!cached) cached = createDb(resolveDatabasePath())
  return cached
}
