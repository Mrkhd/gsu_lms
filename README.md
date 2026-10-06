# GSU Postgraduate — Learning Platform

A clean, modern, standalone Learning Management System focused on the useful core of Tutor LMS
without cloning it: **courses, bundles, time-limited access, lessons, progress and a simple
admin/instructor experience**.

Built to be extended — access, payments and content storage are abstracted so new capabilities can
be added without a rewrite.

---

## University configuration (4-semester programs, pay per semester)

The platform is configured for a university model:

- A **Program** (e.g. `BSc Computer Science`) is made of **4 semesters** by default.
- Each **semester is a purchasable package** (a course package / `Bundle`) mapped to the program
  via `program_semesters`, with a semester number and title.
- Students **pay per semester** — buying a semester unlocks that semester's courses for one term
  (`accessDurationDays`, e.g. 120 days). Unpaid semesters stay locked.
- Paying for any semester **auto-registers** the student in the program (`program_enrollments`),
  and `currentSemester` advances to the highest semester paid.
- Paying for an earlier semester afterwards unlocks it without moving the programme backwards.

Because a semester is just a course package with an access window, the feature reuses the existing,
verified **order → payment → enrollment → access** pipeline. No course records are duplicated and no
parallel e-commerce code was added.

| Surface | Where |
| ------- | ----- |
| Public program catalog + detail (per-semester "Pay" buttons) | `/programs`, `/programs/[slug]` |
| Student program progress + pay unpaid semesters | `/dashboard/program` |
| Admin program builder (semester → package mapping) | `/admin/programs` |

> Semester packages are managed under **Admin → Semester packages** (the `Bundles` screen); the
> admin program builder then assigns one package to each semester.

---

## Tech stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Server Components)          |
| Language       | TypeScript (strict)                                 |
| Database       | Cloudflare D1 (SQLite) + Drizzle ORM                |
| Object storage | Cloudflare R2 (videos, PDFs)                        |
| Deployment     | Cloudflare Workers via vinext + `@cloudflare/vite-plugin` |
| UI             | shadcn/ui + Tailwind CSS v4 + Lucide icons          |
| Forms          | React Hook Form (complex forms) + Server Actions    |
| Validation     | Zod (server-authoritative)                          |
| Auth           | JWT sessions in httpOnly cookies (`jose`) + bcrypt  |
| Payments       | Provider interface with a built-in **mock** provider |
| Drag & drop    | `@dnd-kit` (curriculum + lesson reordering)         |
| Charts         | Recharts via shadcn `chart`                         |

> **Note:** this project targets **Next.js 16**, which renamed `middleware` to `proxy`, made
> `params`/`searchParams`/`cookies()`/`headers()` asynchronous, and removed `next lint`. The code
> follows those conventions — see `src/proxy.ts` for the auth gate.

---

## Quick start

This app runs on **Cloudflare Workers**, using **D1** for data and **R2** for media, via
[vinext](https://vinext.dev).

```bash
# 1. Install dependencies
npm install

# 2. Apply the schema + demo data to a local D1 (no Cloudflare account needed)
npm run db:migrate:local    # wrangler d1 execute --local (drizzle/migrations)
npm run db:seed:local       # generates + applies drizzle/seed.sql locally

# 3. Run
npm run dev:vinext          # Vite + workerd with local D1 + R2 (http://localhost:3001)

# Optional: run the production Worker locally
npm run build
npm run start:vinext        # wrangler dev on the built output (http://localhost:8787)
```

`npm run dev` / `npm run build:next` still run the plain Next.js dev/build (no Cloudflare bindings),
but the app targets Cloudflare — use `dev:vinext` for real development.

## Deploy to Cloudflare

```bash
# One-time provisioning
npx wrangler d1 create gsu-postgraduate        # copy database_id into wrangler.jsonc
npx wrangler r2 bucket create gsu-postgraduate-media
npx wrangler secret put SESSION_SECRET

# Apply schema + optional demo data to the remote D1
npm run db:migrate:remote
npm run db:seed:remote

# Build and deploy
npm run build
npm run deploy
```

Bindings are declared in `wrangler.jsonc` (`DB` = D1, `BUCKET` = R2) and read at runtime via
`import { env } from "cloudflare:workers"` (see `src/db/client.ts` and `src/db/storage.ts`).

### Storage (R2)

Lesson videos and PDFs can be uploaded from the course builder (the file pickers next to *Video URL*
/ *PDF URL*). Uploads go through `uploadMediaAction` into the `BUCKET` binding, and are served by the
authenticated route `src/app/media/[...key]/route.ts`. You can still paste external URLs (YouTube,
Vimeo, etc.) — video embeds handle those automatically.

### Demo accounts (after seeding)

| Role       | Email                   | Password      |
| ---------- | ----------------------- | ------------- |
| Admin      | `admin@lms.test`        | `password123` |
| Instructor | `instructor@lms.test`   | `password123` |
| Student    | `student@lms.test`      | `password123` |

The seed creates a **`BSc Computer Science`** program with 4 semesters (each a $1,200 semester
package of 3 courses). The demo student is registered in the program with **Semester 1 paid**
(Semesters 2–4 locked) to demonstrate pay-per-semester. They also own the Web Development Bundle,
have partial progress in *JavaScript Fundamentals*, and have an **expired** enrollment in
*Python for Beginners* to demonstrate the access rules.

---

## Feature map

**Public**
- `/` landing page, `/programs` catalog, `/courses` catalog (search · category · sort · pagination), `/bundles`
- `/programs/[slug]` — 4-semester overview with per-semester price, courses and **Pay for Semester N**
- `/courses/[slug]` — price, **access duration**, curriculum, requirements, instructor, reviews
- `/bundles/[slug]` — included courses, individual value vs bundle price, savings

**Student** (`/dashboard`)
- Overview with continue-learning, progress and stats
- My program (semester progress, pay unpaid semesters), my courses (progress + access expiry + renew),
  semester packages, orders (with "Pay now"), profile
- `/checkout/[course|bundle]/[slug]` → order → payment → instant access
- `/learn/[courseSlug]/[lessonId]` — sidebar curriculum, video/text/PDF lessons, prev/next,
  mark complete, resume, live expiry indicator; blocked with a **Renew access** screen when expired

**Instructor** (`/instructor`)
- Dashboard, course list, course builder (basic info + drag-and-drop curriculum), enrolled students

**Admin** (`/admin`)
- Dashboard with stats, revenue chart and recent orders
- Programs (4-semester builder), Courses, Semester packages/Bundles, Categories
- Students, Instructors (create users, change roles, suspend/delete)
- Orders (view/refund/cancel), Enrollments (grant/edit/revoke), Settings

---

## Architecture

```
src/
├── app/                    # App Router routes (route groups: (marketing), (auth))
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── admin/              # course + bundle builders, dialogs, tables
│   ├── learn/              # learning experience + access-blocked screen
│   └── ...                 # shared UI (cards, header, dashboard shell…)
├── db/
│   ├── schema.ts           # Drizzle schema (SQLite/D1) + relations
│   ├── client.ts           # getDb() via cloudflare:workers env
│   ├── storage.ts          # R2 put/get/delete + key helpers
│   ├── types.ts            # string unions replacing enums
│   └── options.ts          # shared select-option queries
├── hooks/use-action-form.ts
├── lib/
│   ├── env.ts              # Zod-validated env (bindings + fallback)
│   ├── auth/               # JWT session, password hashing, RBAC guards
│   ├── access.ts           # enrollment access rules + grant/merge logic
│   ├── orders.ts           # order creation, checkout, fulfillment, refunds
│   ├── payments/           # PaymentProvider interface + mock provider
│   ├── queries.ts          # reusable read models
│   └── validations/        # Zod schemas
├── server/actions/         # "use server" mutations (the only write path)
└── proxy.ts                # Next 16 auth proxy (was middleware)
```

### Data model (Cloudflare D1 / SQLite)

`users` · `profiles` · `course_categories` · `courses` · `course_sections` · `lessons` ·
`bundles` · `bundle_courses` · `programs` · `program_semesters` · `program_enrollments` ·
`enrollments` · `bundle_enrollments` · `lesson_progress` ·
`orders` · `order_items` · `reviews` · `notifications`

Indexes and unique constraints are defined on `users.email`, `courses.slug`, `bundles.slug`,
`programs.slug`, `program_semesters.(program_id, number)`, `enrollments.(student_id, course_id)`,
`enrollments.expires_at`, `orders.status`, etc. See `src/db/schema.ts`.

### Access control (the heart of the system)

A single rule is enforced **everywhere, server-side**:

```text
enrollment.status === ACTIVE  AND  (expires_at IS NULL OR expires_at > NOW())
```

- `src/lib/access.ts` implements it (`getCourseAccess`, `getBundleAccess`, `isEnrollmentActive`).
- `src/lib/auth/server.ts` holds page guards (`requireUser`, `requireRole`, `requireAdmin`,
  `requireInstructor`) and action guards.
- `src/proxy.ts` is an **optimistic** gate only (cookie/JWT). Real authorization is always
  re-checked inside pages and every server action — never trust the client or a URL.

### Time-limited access

- Products store an `accessDurationDays` (`null` = lifetime).
- The **expiry is written onto the enrollment** at grant time, so later product changes never
  affect existing students (6 months → 12 months leaves old purchases untouched).
- Repeated grants use the rule: **lifetime wins, otherwise the later expiry wins** — so buying a
  bundle never shortens access a student already owns.

### Bundle → course derivation

Purchasing a bundle creates a `bundle_enrollment` and then one `enrollment` per included course,
all sharing the bundle's access window. Course records are never duplicated.

### Program → semester derivation

When a purchased bundle is a program semester (`program_semesters`), `fulfillOrder` also upserts a
`program_enrollment` and advances `currentSemester` to the highest semester paid. Semester courses
unlock through the same bundle → course derivation above, so an unpaid semester's courses return
`hasAccess: false` and the learning routes show the blocked/expired screen.

### Payments

`src/lib/payments/` defines a tiny `PaymentProvider` interface. The MVP ships a `MockPaymentProvider`
that approves instantly. `src/lib/orders.ts` owns order creation, checkout, idempotent fulfillment
and refunds; swapping in Stripe/Paddle means implementing the interface and registering it —
no other file imports a provider SDK.

---

## Scripts

| Script                | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `npm run dev:vinext`     | Dev server (Vite + workerd, local D1 + R2)     |
| `npm run build`          | Build the Cloudflare Worker (vinext)          |
| `npm run start:vinext`   | Run the built Worker locally (wrangler dev)   |
| `npm run deploy`         | Build + deploy to Cloudflare Workers          |
| `npm run dev`            | Plain Next.js dev server (no bindings)        |
| `npm run lint`           | ESLint                                        |
| `npm run typecheck`      | `tsc --noEmit`                                |
| `npm run db:generate`    | Generate Drizzle SQL migrations               |
| `npm run db:seed:generate` | Generate `drizzle/seed.sql` from `scripts/seed.mjs` |
| `npm run db:migrate:local` / `:remote` | Apply migrations to local/remote D1 |
| `npm run db:seed:local` / `:remote`    | Seed local/remote D1                |

---

## Security summary

- bcrypt password hashing; JWT session in an `httpOnly`, `sameSite=lax`, `secure`-in-prod cookie.
- Role-based access control on every page and server action (`ADMIN` / `INSTRUCTOR` / `STUDENT`).
- Instructors can only manage their own courses (`canManageCourse`).
- Server-side enrollment verification; protected lessons are never rendered without active access.
- Zod validation on all mutations; only sanitized fields are exposed to the client.
- Students cannot reach a course by editing a URL — access is verified on the server.

---

## Deliberately out of scope (MVP)

Marketplace features, instructor commissions, subscriptions/memberships, live classes, SCORM/H5P,
advanced question banks/exams, advanced analytics and affiliates. The abstractions above leave room
to add these later.
