// Applies the generated drizzle/seed.sql to the local SQLite database.
// Usage: node scripts/seed.mjs && node scripts/apply-seed.mjs
import Database from "better-sqlite3"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"

const dbPath = process.env.DATABASE_PATH ?? "./data/lms.db"
if (dbPath !== ":memory:") {
  const dir = dirname(dbPath)
  if (dir && dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const seedFile = join(process.cwd(), "drizzle", "seed.sql")
if (!existsSync(seedFile)) {
  console.error("drizzle/seed.sql not found. Run `node scripts/seed.mjs` first.")
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")
db.exec(readFileSync(seedFile, "utf8"))
console.log(`Seed applied to ${dbPath}.`)
