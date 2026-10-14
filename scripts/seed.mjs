// Generates drizzle/seed.sql (SQLite) with the GSU postgraduate programs.
// Run: npm run db:seed   (generates drizzle/seed.sql then applies it to
// the SQLite database at DATABASE_PATH, default ./data/lms.db)
import { writeFileSync } from "node:fs"
import bcrypt from "bcryptjs"

const now = Date.now()
const passwordHash = bcrypt.hashSync("password123", 10)

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`)
const json = (arr) => q(JSON.stringify(arr))
const slugify = (s) =>
  s.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70)

const sql = []

function insert(table, columns, values) {
  if (!values.length) return
  sql.push(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n` +
      values.map((row) => `  (${row.join(", ")})`).join(",\n") +
      ";"
  )
}

// --- clear (child -> parent) so the seed replaces existing data ---
const CLEAR = [
  "form_submissions",
  "forms",
  "notifications",
  "messages",
  "conversations",
  "assignment_submissions",
  "assignments",
  "lesson_progress",
  "reviews",
  "bundle_enrollments",
  "course_locks",
  "enrollments",
  "program_enrollments",
  "order_items",
  "orders",
  "program_semesters",
  "bundle_courses",
  "lessons",
  "course_sections",
  "courses",
  "bundles",
  "programs",
  "course_categories",
  "profiles",
  "users",
]
sql.push(CLEAR.map((t) => `DELETE FROM ${t};`).join("\n"))

// --- users ---
insert(
  "users",
  ["id", "email", "password_hash", "role", "status", "created_at", "updated_at"],
  [
    [q("u-admin"), q("admin@lms.test"), q(passwordHash), q("ADMIN"), q("ACTIVE"), now, now],
    [q("u-instructor"), q("instructor@gsu.edu"), q(passwordHash), q("INSTRUCTOR"), q("ACTIVE"), now, now],
    [q("u-student"), q("student@lms.test"), q(passwordHash), q("STUDENT"), q("ACTIVE"), now, now],
    [q("u-student2"), q("student2@lms.test"), q(passwordHash), q("STUDENT"), q("ACTIVE"), now, now],
  ]
)
insert(
  "profiles",
  ["id", "user_id", "first_name", "last_name", "headline", "bio", "avatar_url", "created_at", "updated_at"],
  [
    [q("p-admin"), q("u-admin"), q("Sara"), q("Admin"), q("Registrar, GSU"), "NULL", "NULL", now, now],
    [q("p-instructor"), q("u-instructor"), q("Amira"), q("Hassan"), q("Postgraduate Faculty, GSU"), q("Instructor across the postgraduate programs."), "NULL", now, now],
    [q("p-student"), q("u-student"), q("Layla"), q("Noor"), "NULL", "NULL", "NULL", now, now],
    [q("p-student2"), q("u-student2"), q("Omar"), q("Saleh"), "NULL", "NULL", "NULL", now, now],
  ]
)

// --- programs (from the landing page) ---
const PROGRAMS = [
  ["Health Sciences", "Master of Science in Public Health"],
  ["Information Technology", "Master of Computer Science"],
  ["Engineering & Environment", "Master of Water Resources Management"],
  ["Architecture & Construction", "Master of Construction Management"],
  ["Business & Finance", "Master of Accounting"],
  ["Healthcare Administration", "Master of Business Administration in Health Care Management"],
  ["Management", "Master of Business Administration in Project Management"],
  ["Social Sciences", "Master of Education"],
  ["Political Science", "Master of International Relations and Arid Policies"],
  ["Business Administration", "Master of Business Administration"],
  ["General", "Climate change and Environmental sustainability"],
  ["General", "Nutrition"],
]
const SEMESTERS_PER_PROGRAM = 4
const COURSES_PER_SEMESTER = 2

const facultySet = [...new Set(PROGRAMS.map(([f]) => f))]
const categoryRows = facultySet.map((faculty, i) => [
  q(`cat-${i}`),
  q(faculty),
  q(slugify(faculty)),
  q(`${faculty} programs`),
  now,
  now,
])
insert(
  "course_categories",
  ["id", "name", "slug", "description", "created_at", "updated_at"],
  categoryRows
)

const programRows = []
const programSemesterRows = []
const bundleRows = []
const bundleCourseRows = []
const courseRows = []
const sectionRows = []
const lessonRows = []

PROGRAMS.forEach(([faculty, title], pi) => {
  const pid = `prog-${pi}`
  const categoryId = `cat-${facultySet.indexOf(faculty)}`
  programRows.push([
    q(pid),
    q(title),
    q(slugify(title)),
    "NULL",
    q(`${title} — offered in collaboration with Lincoln University College.`),
    q(`${title}, delivered across ${SEMESTERS_PER_PROGRAM} semesters.`),
    "NULL",
    q("Master"),
    SEMESTERS_PER_PROGRAM,
    120,
    q("PUBLISHED"),
    now,
    now,
    now,
  ])

  for (let n = 1; n <= SEMESTERS_PER_PROGRAM; n++) {
    const bid = `b-${pi}-${n}`
    const semesterTitle = `${title} — Semester ${n}`
    bundleRows.push([
      q(bid),
      q(semesterTitle),
      q(`${slugify(title)}-semester-${n}`),
      q(`Semester ${n} of the ${title} program.`),
      "NULL",
      "NULL",
      120,
      q("PUBLISHED"),
      now,
      now,
      now,
    ])
    programSemesterRows.push([q(`ps-${pi}-${n}`), q(pid), q(bid), n, q(semesterTitle), now, now])

    for (let k = 1; k <= COURSES_PER_SEMESTER; k++) {
      const cid = `c-${pi}-${n}-${k}`
      const courseTitle = `${title} — Semester ${n} Course ${k}`
      courseRows.push([
        q(cid),
        q(courseTitle),
        q(`${slugify(title)}-s${n}-c${k}`),
        q(`Core course ${k} for semester ${n} of ${title}.`),
        q(`${courseTitle} is a core course in the ${title} postgraduate program.`),
        "NULL",
        q("BEGINNER"),
        180,
        q("PUBLISHED"),
        json([`Understand the foundations of ${faculty}`, "Apply research and professional practice"]),
        json(["A bachelor's degree or equivalent"]),
        q(categoryId),
        q("u-instructor"),
        now,
        now,
        now,
      ])
      bundleCourseRows.push([q(`bc-${pid}-${n}-${k}`), q(bid), q(cid), k - 1])

      const sid = `s-${pid}-${n}-${k}`
      sectionRows.push([q(sid), q(cid), q(`Module ${k}`), 0, now, now])
      lessonRows.push([q(`l-${pid}-${n}-${k}-1`), q(cid), q(sid), q(`${courseTitle} — Introduction`), q("VIDEO"), q("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "NULL", "NULL", 12, 0, 1, now, now])
      lessonRows.push([q(`l-${pid}-${n}-${k}-2`), q(cid), q(sid), q(`${courseTitle} — Core concepts`), q("TEXT"), "NULL", q("Study the core concepts and complete the exercises."), "NULL", 18, 1, 0, now, now])
    }
  }
})

insert(
  "programs",
  ["id", "title", "slug", "code", "short_description", "description", "thumbnail_url", "level", "semester_count", "access_duration_days", "status", "published_at", "created_at", "updated_at"],
  programRows
)
insert(
  "bundles",
  ["id", "title", "slug", "short_description", "description", "thumbnail_url", "access_duration_days", "status", "published_at", "created_at", "updated_at"],
  bundleRows
)
insert("courses", ["id", "title", "slug", "short_description", "description", "thumbnail_url", "level", "access_duration_days", "status", "what_you_learn", "requirements", "category_id", "instructor_id", "published_at", "created_at", "updated_at"], courseRows)
insert(
  "program_semesters",
  ["id", "program_id", "bundle_id", "number", "title", "created_at", "updated_at"],
  programSemesterRows
)
insert("bundle_courses", ["id", "bundle_id", "course_id", "position"], bundleCourseRows)
insert("course_sections", ["id", "course_id", "title", "position", "created_at", "updated_at"], sectionRows)
insert("lessons", ["id", "course_id", "section_id", "title", "type", "video_url", "content", "pdf_url", "duration_minutes", "position", "is_preview", "created_at", "updated_at"], lessonRows)

// --- assign the demo student Semester 1 of the first program (admin assignment) ---
const expires = now + 1000 * 60 * 60 * 24 * 120
insert(
  "bundle_enrollments",
  ["id", "student_id", "bundle_id", "source", "source_id", "started_at", "expires_at", "status", "created_at", "updated_at"],
  [[q("be1"), q("u-student"), q("b-0-1"), q("ADMIN_GRANT"), "NULL", now, expires, q("ACTIVE"), now, now]]
)
insert(
  "enrollments",
  ["id", "student_id", "course_id", "bundle_id", "source", "source_id", "started_at", "expires_at", "status", "created_at", "updated_at"],
  [1, 2].map((k) => [
    q(`e0-1-${k}`),
    q("u-student"),
    q(`c-0-1-${k}`),
    q("b-0-1"),
    q("ADMIN_GRANT"),
    "NULL",
    now,
    expires,
    q("ACTIVE"),
    now,
    now,
  ])
)
insert(
  "program_enrollments",
  ["id", "student_id", "program_id", "status", "current_semester", "started_at", "created_at", "updated_at"],
  [[q("pe-0"), q("u-student"), q("prog-0"), q("ACTIVE"), 1, now, now, now]]
)

// --- scholarship form (public, no sign-in required) ---
const scholarshipFields = [
  { id: "application-number", type: "TEXT", label: "Application number", required: true, placeholder: "e.g. GSU-2026-00123" },
  {
    id: "reason",
    type: "PARAGRAPH",
    label: "Why are you applying for the scholarship?",
    required: true,
    placeholder: "Tell us about your circumstances and motivation.",
  },
]
insert(
  "forms",
  ["id", "title", "slug", "description", "status", "fields", "created_by", "created_at", "updated_at"],
  [
    [
      q("form-scholarship"),
      q("50% Scholarship Application"),
      q("scholarship"),
      q("Admitted students can apply for a 50% scholarship. Enter your full name, email and application number, then tell us why you are applying. Your details are required so we can match your application."),
      q("PUBLISHED"),
      json(scholarshipFields),
      q("u-admin"),
      now,
      now,
    ],
  ]
)

writeFileSync("drizzle/seed.sql", sql.join("\n\n") + "\n")
console.log(`Wrote drizzle/seed.sql (${sql.length} statements, ${PROGRAMS.length} programs)`)
