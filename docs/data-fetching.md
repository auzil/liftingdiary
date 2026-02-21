# Data Fetching Standards

## Core Rules

> **ABSOLUTELY NO route handlers. No exceptions.**
> **ALL data fetching must happen in Server Components using the service pattern. No exceptions.**

- **Never** create a `route.ts` file under `src/app/` — there are no API route handlers in this project.
- **Never** import `db` in a `page.tsx` or layout file.
- **Never** add `"use client"` to a page that fetches data — data-fetching pages are Server Components by default.
- **Never** fetch data without first verifying `userId` from Clerk and redirecting unauthenticated users.
- **Never** use `db.execute(sql`...`)` or hand-written SQL strings — all queries must use Drizzle's query builder API (`.select()`, `.insert()`, `.update()`, `.delete()`) or the relational query API (`db.query.*`). The `sql` tagged-template helper is only allowed for computed column defaults in `schema.ts`, never inside service query bodies.

---

## Layered Architecture

Every data flow follows this strict two-layer stack:

```
Page (Server Component) → Service → db
```

| Layer | Location | Responsibility |
|---|---|---|
| Page | `src/app/**/page.tsx` | Auth check, calls service functions, passes data as props |
| Service | `src/services/<entity>.ts` | Drizzle queries + business logic, scoped by `userId` |
| DB | `src/db` | Drizzle client + schema — never imported above the service layer |

**A page never imports `db` or schema.** Services are the only layer that touches `db`.

---

## Service Pattern

Every entity gets a corresponding service file at `src/services/<entity>.ts`.

Service functions accept `userId`, write Drizzle queries directly, and apply any business logic. Service functions always scope every query to `userId` with a `where` clause.

```ts
// src/services/workouts.ts
import { db } from "@/db"
import { workouts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export type Workout = typeof workouts.$inferSelect

export async function getWorkoutsByUserId(userId: string): Promise<Workout[]> {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.date))
}
```

As business logic grows (filtering, sorting, combining multiple queries), it belongs in the service — not in the page.

---

## Server Component Pattern

A data-fetching page has no `"use client"` directive. It calls `auth()` to get `userId`, calls a **service** function, then passes data as props to any `"use client"` child components.

```tsx
// src/app/dashboard/page.tsx  ← no "use client"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getWorkoutsByUserId } from "@/services/workouts"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const workouts = await getWorkoutsByUserId(userId)

  return <DashboardClient workouts={workouts} />
}
```

`DashboardClient` (or any interactive component) carries `"use client"` and receives data as props — it never fetches.

---

## What NOT to Do

**No route handlers:**

```ts
// ❌ src/app/api/workouts/route.ts — forbidden
import { db } from "@/db"

export async function GET() {
  const rows = await db.select().from(workouts)
  return Response.json(rows)
}
```

**No raw Drizzle in pages:**

```tsx
// ❌ src/app/dashboard/page.tsx — forbidden
import { db } from "@/db"
import { workouts } from "@/db/schema"

export default async function DashboardPage() {
  const rows = await db.select().from(workouts) // ← direct db call in page
  ...
}
```

| Allowed | Not allowed |
|---|---|
| `getWorkoutsByUserId(userId)` imported from `@/services/workouts` | `db.select().from(workouts)` in `page.tsx` |
| Server Component page with no `"use client"` | A `route.ts` API handler returning JSON |
| Service function scoped by `userId` | An unscoped query returning all users' data |

---

## Auth Enforcement

Every Server Component page that fetches data must:

1. Call `auth()` from `@clerk/nextjs/server` at the top of the function.
2. Immediately `redirect("/")` if `userId` is `null` — unauthenticated users must never reach data.

```tsx
const { userId } = await auth()
if (!userId) redirect("/")
```

Service functions must accept `userId` as a parameter and **always** scope every query to that user with a `where` clause. Unscoped queries that could return another user's rows are forbidden.

```ts
// ✅ correct — scoped to userId
export async function getWorkoutsByUserId(userId: string): Promise<Workout[]> {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
}

// ❌ forbidden — unscoped, returns all users' workouts
export async function getAllWorkouts(): Promise<Workout[]> {
  return db.select().from(workouts)
}
```
