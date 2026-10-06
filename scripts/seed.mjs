// Generates drizzle/seed.sql (D1-compatible INSERTs) for demo data.
// Run: node scripts/seed.mjs   then apply with:
//   wrangler d1 execute gsu-postgraduate --local  --file drizzle/seed.sql
//   wrangler d1 execute gsu-postgraduate --remote --file drizzle/seed.sql
import { writeFileSync } from "node:fs"
import bcrypt from "bcryptjs"

const now = Date.now()
const passwordHash = bcrypt.hashSync("password123", 10)
const time = `0, ${now}, ${now}` // created_at, updated_at columns handled per insert below

const q = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`
const json = (arr) => q(JSON.stringify(arr))
const rows = []

function insert(table, columns, values) {
  rows.push(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n` +
      values.map((row) => `  (${row.join(", ")})`).join(",\n") +
      ";"
  )
}

const added = now - 1000 * 60 * 60 * 24 * 120

// Users
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
    [q("p-admin"), q("u-admin"), q("Sara"), q("Admin"), q("Platform owner"), "NULL", "NULL", now, now],
    [q("p-instructor"), q("u-instructor"), q("Amira"), q("Hassan"), q("Instructor, GSU Postgraduate"), q("Teaches across the postgraduate programs."), "NULL", now, now],
    [q("p-student"), q("u-student"), q("Layla"), q("Noor"), "NULL", "NULL", "NULL", now, now],
    [q("p-student2"), q("u-student2"), q("Omar"), q("Saleh"), "NULL", "NULL", "NULL", now, now],
  ]
)

// Categories
insert(
  "course_categories",
  ["id", "name", "slug", "description", "created_at", "updated_at"],
  [
    [q("cat-web"), q("Web Development"), q("web-development"), q("Build for the web."), now, now],
    [q("cat-programming"), q("Programming"), q("programming"), q("General programming skills."), now, now],
  ]
)

// Courses
const courseSeeds = [
  ["c-html", "HTML & CSS Fundamentals", "html-css-fundamentals", 25, "cat-web", ["Write semantic HTML", "Style with CSS"]],
  ["c-js", "JavaScript Fundamentals", "javascript-fundamentals", 35, "cat-web", ["Understand the DOM", "Write async code"]],
  ["c-react", "React Fundamentals", "react-fundamentals", 45, "cat-web", ["Build components", "Manage state"]],
  ["c-node", "Node.js Fundamentals", "nodejs-fundamentals", 40, "cat-web", ["Build APIs", "Understand the event loop"]],
  ["c-python", "Python for Beginners", "python-for-beginners", 30, "cat-programming", ["Python syntax", "Data structures"]],
]
insert(
  "courses",
  ["id", "title", "slug", "short_description", "description", "thumbnail_url", "level", "price", "access_duration_days", "status", "what_you_learn", "requirements", "category_id", "instructor_id", "published_at", "created_at", "updated_at"],
  courseSeeds.map(([id, title, slug, price, cat, learn]) => [
    q(id), q(title), q(slug), q(`${title} course.`), q(`${title} is a hands-on course.`), "NULL",
    q("BEGINNER"), price, 180, q("PUBLISHED"), json(learn), json(["A computer with internet access"]),
    q(cat), q("u-instructor"), now, now, now,
  ])
)

// Sections + lessons
const sectionRows = []
const lessonRows = []
courseSeeds.forEach(([cid, title]) => {
  const sid = `s-${cid}`
  sectionRows.push([q(sid), q(cid), q("Getting started"), 0, now, now])
  lessonRows.push([q(`l-${cid}-1`), q(cid), q(sid), q(`${title}: Introduction`), q("VIDEO"), q("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "NULL", "NULL", 10, 0, 1, now, now])
  lessonRows.push([q(`l-${cid}-2`), q(cid), q(sid), q(`${title}: Core concepts`), q("TEXT"), "NULL", q("Study the core concepts."), "NULL", 15, 1, 0, now, now])
})
insert("course_sections", ["id", "course_id", "title", "position", "created_at", "updated_at"], sectionRows)
insert("lessons", ["id", "course_id", "section_id", "title", "type", "video_url", "content", "pdf_url", "duration_minutes", "position", "is_preview", "created_at", "updated_at"], lessonRows)

// Bundles: a web-dev bundle + 4 semester packages
const semesterNames = ["Foundations", "Core Computing", "Advanced Development", "Specialisation & Capstone"]
const bundleRows = []
const bundleCourseRows = []
bundleRows.push([q("b-webdev"), q("Web Development Bundle"), q("web-development-bundle"), q("Everything you need to become a web developer."), q("HTML, CSS, JavaScript, React and Node.js."), "NULL", 80, 180, q("PUBLISHED"), now, now, now])
;["c-html", "c-js", "c-react", "c-node"].forEach((courseId, i) => bundleCourseRows.push([q(`bc-webdev-${i}`), q("b-webdev"), q(courseId), i]))

const semesterCourses = [["c-html", "c-python"], ["c-js"], ["c-react"], ["c-node"]]
semesterCourses.forEach((courseIds, i) => {
  const bid = `b-sem-${i + 1}`
  bundleRows.push([q(bid), q(`Semester ${i + 1} — ${semesterNames[i]}`), q(`semester-${i + 1}`), q(`Courses for semester ${i + 1}.`), q(`Semester ${i + 1} of the BSc Computer Science program.`), "NULL", 1200, 120, q("PUBLISHED"), now, now, now])
  courseIds.forEach((courseId, index) => bundleCourseRows.push([q(`bc-${bid}-${index}`), q(bid), q(courseId), index]))
})
insert("bundles", ["id", "title", "slug", "short_description", "description", "thumbnail_url", "price", "access_duration_days", "status", "published_at", "created_at", "updated_at"], bundleRows)
insert("bundle_courses", ["id", "bundle_id", "course_id", "position"], bundleCourseRows)

// Program
insert("programs", ["id", "title", "slug", "code", "short_description", "description", "thumbnail_url", "level", "semester_count", "access_duration_days", "status", "published_at", "created_at", "updated_at"], [
  [q("prog-cs"), q("BSc Computer Science"), q("bsc-computer-science"), q("BSC-CS"), q("A four-semester undergraduate degree."), q("Delivered across four semesters; pay per semester."), "NULL", q("Bachelor"), 4, 120, q("PUBLISHED"), now, now, now],
])
insert("program_semesters", ["id", "program_id", "bundle_id", "number", "title", "created_at", "updated_at"],
  semesterNames.map((name, i) => [q(`ps-${i + 1}`), q("prog-cs"), q(`b-sem-${i + 1}`), i + 1, q(`Semester ${i + 1} — ${name}`), now, now]))

// Orders + enrollments (student bought the Web Dev bundle)
const expires = now + 1000 * 60 * 60 * 24 * 180
insert("orders", ["id", "number", "student_id", "status", "subtotal", "discount", "total", "currency", "provider", "provider_ref", "paid_at", "created_at", "updated_at"], [
  [q("o1"), 10001, q("u-student"), q("PAID"), 80, 0, 80, q("USD"), q("mock"), q("mock_seed"), added, added, added],
  [q("o2"), 10002, q("u-student"), q("PAID"), 1200, 0, 1200, q("USD"), q("mock"), q("mock_seed2"), added, added, added],
])
insert("order_items", ["id", "order_id", "item_type", "course_id", "bundle_id", "title", "unit_price", "quantity", "total_price", "created_at"], [
  [q("oi1"), q("o1"), q("BUNDLE"), "NULL", q("b-webdev"), q("Web Development Bundle"), 80, 1, 80, added],
  [q("oi2"), q("o2"), q("BUNDLE"), "NULL", q("b-sem-1"), q("Semester 1 — Foundations"), 1200, 1, 1200, added],
])
insert("bundle_enrollments", ["id", "student_id", "bundle_id", "source", "source_id", "started_at", "expires_at", "status", "created_at", "updated_at"], [
  [q("be1"), q("u-student"), q("b-webdev"), q("BUNDLE_PURCHASE"), q("o1"), added, expires, q("ACTIVE"), added, added],
  [q("be2"), q("u-student"), q("b-sem-1"), q("BUNDLE_PURCHASE"), q("o2"), added, expires, q("ACTIVE"), added, added],
])
insert("enrollments", ["id", "student_id", "course_id", "bundle_id", "source", "source_id", "started_at", "expires_at", "status", "created_at", "updated_at"],
  ["c-html", "c-js", "c-react", "c-node", "c-python"].map((courseId, i) => [q(`e${i + 1}`), q("u-student"), q(courseId), q(i === 4 ? "b-webdev" : "b-webdev"), q("BUNDLE_PURCHASE"), q("o1"), added, expires, q("ACTIVE"), added, added]))
insert("program_enrollments", ["id", "student_id", "program_id", "status", "current_semester", "started_at", "created_at", "updated_at"], [
  [q("pe1"), q("u-student"), q("prog-cs"), q("ACTIVE"), 1, added, added, added],
])
insert("lesson_progress", ["id", "student_id", "lesson_id", "course_id", "completed", "completed_at", "last_viewed_at", "created_at", "updated_at"], [
  [q("lp1"), q("u-student"), q("l-c-js-1"), q("c-js"), 1, added, added, added, added],
])

writeFileSync("drizzle/seed.sql", rows.join("\n\n") + "\n")
console.log(`Wrote drizzle/seed.sql (${rows.length} statements)`)
