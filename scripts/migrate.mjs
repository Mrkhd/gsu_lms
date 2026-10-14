// Applies drizzle/migrations/*.sql to the local SQLite database.
// Usage: node scripts/migrate.mjs  (DATABASE_PATH defaults to ./data/lms.db)
import Database from "better-sqlite3"
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"

const dbPath = process.env.DATABASE_PATH ?? "./data/lms.db"
if (dbPath !== ":memory:") {
  const dir = dirname(dbPath)
  if (dir && dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")
db.exec(
  "CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)"
)

const migrationsDir = join(process.cwd(), "drizzle", "migrations")
const applied = new Set(db.prepare("SELECT name FROM __migrations").all().map((row) => row.name))
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()

let ran = 0
for (const file of files) {
  if (applied.has(file)) continue
  db.exec(readFileSync(join(migrationsDir, file), "utf8"))
  db.prepare("INSERT INTO __migrations (name, applied_at) VALUES (?, ?)").run(file, Date.now())
  console.log(`applied ${file}`)
  ran += 1
}

console.log(ran === 0 ? "Database already up to date." : `Applied ${ran} migration(s) to ${dbPath}.`)
