import { env } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/d1"
import type { D1Database } from "@cloudflare/workers-types"

import * as schema from "./schema"

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type Db = ReturnType<typeof createDb>

/**
 * Returns a Drizzle client bound to the `DB` D1 binding. Safe to call per
 * request; Drizzle is stateless and cheap to construct.
 */
export function getDb(): Db {
  return createDb(env.DB)
}
