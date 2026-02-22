# Folder Structure

## Overview

```
src/
├── app/                        # Next.js App Router — routes and layouts
│   ├── layout.tsx              # Root layout: header (nav + Clerk auth), font setup
│   ├── page.tsx                # Home route (/) — sign-in landing page
│   ├── globals.css             # Global styles (Tailwind base import)
│   ├── workout-header-button.tsx  # "use client" — live Workout button in header
│   │
│   ├── dashboard/
│   │   ├── page.tsx            # Server Component — fetches workouts, renders DashboardClient
│   │   └── dashboard-client.tsx   # "use client" — date filter UI, workout list
│   │
│   ├── workout/
│   │   ├── page.tsx            # Server Component — fetches active/latest workout
│   │   ├── workout-client.tsx  # "use client" — active session (empty/active/idle states)
│   │   └── [id]/
│   │       ├── page.tsx        # Server Component — fetches workout by ID for editing
│   │       └── workout-edit-client.tsx  # "use client" — edit a completed workout
│   │
│   ├── exercises/
│   │   ├── page.tsx            # Server Component — fetches custom exercises
│   │   └── exercises-client.tsx   # "use client" — CRUD UI for custom exercises
│   │
│   └── analytics/
│       └── exercises/
│           ├── page.tsx        # Server Component — fetches exercise analytics + progress
│           └── exercises-analytics-client.tsx  # "use client" — exercise list + chart dialog
│
├── actions/                    # Next.js Server Actions ("use server")
│   ├── workouts.ts             # start, finish, rename, add/remove exercise, add/update/delete set
│   └── exercises.ts            # create, update, delete custom exercise
│
├── services/                   # Data access layer — Drizzle queries, scoped by userId
│   ├── workouts.ts             # getWorkoutsWithDetails, getActiveWorkout, createWorkout, …
│   └── exercises.ts            # getCustomExercises, getExerciseAnalytics, …
│
├── db/                         # Drizzle client and schema
│   ├── index.ts                # Drizzle client (postgres connection)
│   ├── schema.ts               # All table definitions and relations
│   ├── seed.ts                 # Seed script for exercise catalog
│   └── reset.ts                # Dev utility: drop and recreate tables
│
├── components/
│   └── ui/                     # shadcn/ui components only — never add custom files here
│       └── *.tsx
│
├── lib/
│   └── utils.ts                # cn() helper for conditional Tailwind class merging
│
└── proxy.ts                    # Clerk auth middleware (Next.js 16: middleware.ts → proxy.ts)
```

---

## Layered Architecture

Every data flow follows a strict one-way stack:

```
Route (URL)
  → page.tsx          [Server Component]  auth check + service call
    → *-client.tsx    [Client Component]  interactive UI, receives data as props
      ↕
    actions/*.ts      ["use server"]      mutations: auth → service → revalidatePath
      ↕
    services/*.ts     [pure functions]    Drizzle queries, always scoped by userId
      ↕
    db/               [Drizzle + schema]  never imported above the service layer
```

### Rules

- **`page.tsx`** — no `"use client"`. Calls `auth()`, redirects if unauthenticated, calls a service function, passes data as props to the client component.
- **`*-client.tsx`** — `"use client"`. Receives props from its page. Never fetches data directly. Calls Server Actions for mutations.
- **`actions/*.ts`** — `"use server"`. Each action calls `auth()`, delegates to a service, then calls `revalidatePath`.
- **`services/*.ts`** — Plain async functions. Accept `userId` as a parameter. Every query has a `where` clause scoped to that user. Never imported by client components.
- **`db/`** — Only imported by `services/`. Never imported in pages, layouts, or actions directly.

---

## Page / Client File Convention

Each route folder contains exactly two files:

| File | Directive | Responsibility |
|---|---|---|
| `page.tsx` | _(none — Server Component)_ | Auth, data fetch, passes props |
| `*-client.tsx` | `"use client"` | All interactivity and local state |

The one exception is `src/app/workout-header-button.tsx` — a shared client component used by `layout.tsx` to show the live Workout timer in the global header. It lives at the app root rather than inside a route folder because it is layout-level UI, not page-level.

---

## Database Schema (tables)

| Table | Description |
|---|---|
| `exercises` | Global exercise catalog, shared across all users |
| `custom_exercises` | User-defined exercises, scoped by `userId` |
| `workouts` | Training sessions; `completedAt IS NULL` = active |
| `workout_exercises` | Junction: which exercises appear in a workout |
| `sets` | Individual sets (reps + weight) within a workout-exercise |

All user-data tables include `userId` and are indexed on it. Cascading deletes flow from `workouts` → `workout_exercises` → `sets`.
