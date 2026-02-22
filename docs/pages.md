# Pages Documentation

This document covers the four main feature pages: Dashboard, Workout Session, Edit Workout, and Edit Exercises.

All pages share the same structural pattern:
- `page.tsx` — Server Component: enforces auth, fetches data, renders the Client Component
- `*-client.tsx` — Client Component: owns all interactivity, receives data as props

---

## Dashboard (`/dashboard`)

**Files:** `src/app/dashboard/page.tsx`, `src/app/dashboard/dashboard-client.tsx`

### What it does

Displays a history of the user's workouts for a selected time period. Also shows a live timer in the header if a workout is currently active.

### URL parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `range` | `week` \| `month` \| `year` | Preset date range filter (default: `week`) |
| `date` | `yyyy-MM-dd` | Exact single-day filter; takes priority over `range` |

When a `date` param is present, the `range` param is ignored.

### Server Component (`page.tsx`)

1. Authenticates the user via `auth()` from `@clerk/nextjs/server`; redirects to `/` if not logged in.
2. Reads `range` and `date` from `searchParams`.
3. Computes a `{ start, end }` date range using `date-fns` helpers (`startOfWeek`, `endOfMonth`, etc.). Week starts on Monday.
4. Fetches in parallel:
   - `getWorkoutsWithDetailsByUserId(userId, dateRange)` — workouts with exercises and sets
   - `getActiveWorkoutByUserId(userId)` — any currently active (non-completed) workout
5. Passes both to `DashboardClient`.

### Client Component (`dashboard-client.tsx`)

**State:**
- `calendarOpen` — controls the date picker popover
- `elapsed` — seconds since the active workout started (updated by a `setInterval`)
- `mounted` — prevents SSR/hydration mismatch on the calendar popover

**Filter logic:**

The active filter is derived from URL search params (not local state). Clicking a preset or picking a date calls `router.replace` with updated params, which triggers a server re-fetch.

```
ActiveFilter =
  | { kind: "preset"; range: "week" | "month" | "year" }
  | { kind: "exact"; date: Date }
```

**Active workout banner:**

If `activeWorkoutStartedAt` is non-null, the "Workout" button becomes destructive (red) and shows a live elapsed timer formatted as `HH:MM:SS`.

**Workout card:**

Each workout displays:
- Name (falls back to "Untitled Workout")
- Date and duration (minutes, only shown if `completedAt` is set)
- Total sets badge
- Exercise tags with set counts (resolves `customExercise.name ?? exercise.name`)
- Pencil icon linking to `/workout/[id]` (edit page)

---

## Workout Session (`/workout`)

**Files:** `src/app/workout/page.tsx`, `src/app/workout/workout-client.tsx`

### What it does

The primary workout tracking screen. Displays one of three states based on the user's latest workout record.

### Server Component (`page.tsx`)

1. Auth check; redirects to `/` if not logged in.
2. Fetches in parallel:
   - `getLatestWorkoutByUserId(userId)` — the most recent workout (active or completed), or `null`
   - `getExercisesForUser(userId)` — all exercises available to the user (global + custom)
3. Renders `WorkoutClient` with both values.

### Client Component (`workout-client.tsx`)

**State machine** — derived from `latestWorkout`:

| State | Condition | UI shown |
|-------|-----------|----------|
| `empty` | `latestWorkout === null` | Centered card with "Start Workout" button |
| `active` | `latestWorkout.completedAt === null` | Live timer, exercise list, "Finish Workout" button |
| `idle` | `latestWorkout.completedAt !== null` | Summary of last workout, "Start New Workout" button |

**Live timer (active state only):**

A `setInterval` ticks every second and computes elapsed time from `latestWorkout.startedAt`. The effect depends on `latestWorkout?.id` (primitive) rather than the object reference to avoid restarting the timer on re-renders.

**Set draft system:**

Set inputs use a local `setDrafts` map (`Record<number, { reps: string; weight: string }>`) as a staging area. Changes are held locally until `onBlur`, at which point the set is validated and `updateSetAction` is called. This allows free-form text entry without firing a server action on every keystroke.

**Add Set / Save dual-mode button:**

The per-exercise button text and behavior change based on whether any set in that exercise has unsaved draft values:
- If no dirty sets → "Add Set" (calls `addSetAction`, pre-filling last set's reps/weight)
- If dirty sets exist → "Save" (calls `updateSetAction` for all dirty sets in parallel)

**Exercise picker:**

A `Popover` lists only exercises not already added to the workout. The already-added set is tracked by a composite key (`c{id}` for custom, `e{id}` for global).

**Server actions used:**

- `startWorkoutAction` — creates a new workout record
- `finishWorkoutAction(workoutId)` — sets `completedAt`
- `updateWorkoutNameAction(workoutId, name)` — renames the workout (idle state)
- `addExerciseToWorkoutAction(workoutId, exerciseId, customExerciseId)` — adds exercise entry
- `removeExerciseFromWorkoutAction(workoutExerciseId)` — removes exercise and its sets
- `addSetAction(workoutExerciseId, reps, weight)` — appends a set
- `updateSetAction(setId, reps, weight)` — updates an existing set
- `deleteSetAction(setId)` — removes a set

---

## Edit Workout (`/workout/[id]`)

**Files:** `src/app/workout/[id]/page.tsx`, `src/app/workout/[id]/workout-edit-client.tsx`

### What it does

Allows editing any completed (or active) workout by ID. Functionally identical to the active state of the Workout Session page, but operates on a specific workout rather than the user's latest.

### Server Component (`page.tsx`)

1. Auth check; redirects to `/` if not logged in.
2. Parses `id` from params; calls `notFound()` if not a valid integer.
3. Fetches in parallel:
   - `getWorkoutByIdForUser(workoutId, userId)` — ownership-scoped workout lookup; `notFound()` if missing
   - `getExercisesForUser(userId)` — same exercise list used in the workout session
4. Renders `WorkoutEditClient`.

### Client Component (`workout-edit-client.tsx`)

Shares nearly identical structure with `WorkoutClient`'s active state. Key differences:

| Aspect | Workout Session | Edit Workout |
|--------|----------------|--------------|
| Back button | Dashboard + Exercises | Dashboard only |
| No live timer | — | — |
| State machine | 3 states | Fixed (always edit UI) |
| Remove exercise | `X` button, no confirmation | `X` button with `AlertDialog` confirmation |
| `revalidatePath` target | `/workout` | `/workout/${workoutId}` |

**Set editing:**

Same draft/blur pattern as the session page. The save button also passes `workout.id` as a `revalidateId` argument to all Server Actions so the correct route gets revalidated.

**Workout name:**

Editable via an `Input` + "Save" button that calls `updateWorkoutNameAction`. Uses local `saving` boolean for button disabled state (not `useTransition`, since it's a direct `await`).

**Exercise removal:**

Wrapped in an `AlertDialog` warning that removing the exercise will also delete all of its sets. Confirmed via `removeExerciseFromWorkoutAction(workoutExerciseId, workoutId)`.

**Server actions used:** same set as the Workout Session page, with an extra `workoutId` argument threaded through for targeted revalidation.

---

## Exercises (`/exercises`)

**Files:** `src/app/exercises/page.tsx`, `src/app/exercises/exercises-client.tsx`

### What it does

CRUD management for the user's custom exercises. Custom exercises are user-created entries that supplement the built-in global exercise list. They appear in the exercise picker on both the Workout Session and Edit Workout pages.

### Server Component (`page.tsx`)

1. Auth check; redirects to `/` if not logged in.
2. Fetches `getCustomExercisesByUserId(userId)` — the user's custom exercises only.
3. Renders `ExercisesClient`.

### Client Component (`exercises-client.tsx`)

**State:**
- `newOpen` / `newName` — controls the "New Exercise" dialog and its input
- `editingId` / `editDraftName` — tracks which exercise is being edited and its draft name
- `deletingId` — tracks which exercise is pending deletion confirmation
- `pending` (from `useTransition`) — disables all action buttons during any in-flight mutation

**UI patterns:**

Three separate dialogs are used (from shadcn/ui):
1. **Create dialog** (`Dialog`) — text input + Create button; Enter key triggers create
2. **Edit dialog** (`Dialog`) — text input + Save button; Enter key triggers save
3. **Delete confirmation** (`AlertDialog`) — warns that deletion also removes the exercise from any workouts

All dialogs close optimistically before the server action completes. The page re-renders via Next.js route revalidation once the action returns.

**Server actions used:**
- `createCustomExerciseAction(name)` — creates a new custom exercise
- `updateCustomExerciseAction(id, name)` — renames an exercise
- `deleteCustomExerciseAction(id)` — deletes an exercise (cascades to workout entries)

---

---

## Analytics — Exercises (`/analytics/exercises`)

**Files:** `src/app/analytics/exercises/page.tsx`, `src/app/analytics/exercises/exercises-analytics-client.tsx`

### What it does

Analytics view showing every exercise the user has ever logged, ordered by most recently used. Displays the all-time max weight per exercise. Clicking an exercise opens a modal with a line chart of max weight over time.

### Server Component (`page.tsx`)

1. Auth check; redirects to `/` if not logged in.
2. Calls `getExerciseAnalyticsByUserId(userId)` to get the exercise list.
3. Iterates over every exercise and calls `getExerciseProgressByUserId(userId, ex.id)` for each, using `Promise.all` to run them in parallel.
4. Builds `progressByExercise: Record<string, ExerciseProgressPoint[]>` (keyed by exercise composite id).
5. Passes `exercises` and `progressByExercise` to `ExercisesAnalyticsClient`.

No `searchParams`. All progress data is pre-fetched server-side so the client needs no additional fetching when a user opens the modal.

### Client Component (`exercises-analytics-client.tsx`)

**State:**
- `selected: ExerciseAnalytics | null` — the exercise whose progress dialog is open (`null` = closed)

**UI:**
- Back button (`Button` + `ArrowLeft` icon, `Link` to `/dashboard`) — absolute top-left
- `Card` centered, `max-w-md`
- `CardHeader` with title "Exercise History"
- `CardContent`:
  - Empty state: centered `<p className="text-sm text-muted-foreground">` if no exercises logged
  - List: each exercise is a `<button>` (not a static row) that sets `selected` on click:
    - Exercise name (`text-sm font-medium`)
    - Last used date (`text-xs text-muted-foreground`, formatted `dd.MM.yyyy`)
    - `Badge variant="secondary"` showing max weight in kg (omitted if `maxWeight` is null)

**Progress dialog:**

A `Dialog` opens when `selected !== null`. Content:
- `DialogTitle` — exercise name
- If `progress.length < 2`: informational text ("no sets" or "log in more workouts to see chart")
- If `progress.length >= 2`: a Recharts `LineChart` inside `ChartContainer` (224 px tall):
  - `CartesianGrid` (horizontal only, dashed)
  - `XAxis` keyed on `date` string, `interval="preserveStartEnd"`
  - `YAxis` with 36 px width
  - `ChartTooltip` with `ChartTooltipContent indicator="line"`
  - Single `Line` (type `"monotone"`, `dataKey="maxWeight"`, `connectNulls={true}`)

### Service functions (`src/services/exercises.ts`)

**`getExerciseAnalyticsByUserId(userId)`**
- Runs two parallel Drizzle queries — one for global exercises, one for custom exercises
- Each query: joins `workoutExercises` → `exercises`/`customExercises` → `workouts` (filtered by userId) → left join `sets`
- Aggregates `MAX(workouts.startedAt)` as `lastUsedAt` and `MAX(sets.weight)` as `maxWeight`, grouped by exercise
- Merges both result arrays and sorts by `lastUsedAt DESC` in the service layer

Return type:
```ts
export type ExerciseAnalytics = {
  id: string           // composite key: "e{id}" | "c{id}"
  name: string
  lastUsedAt: Date
  maxWeight: string | null  // numeric string from DB
}
```

**`getExerciseProgressByUserId(userId, exerciseKey)`**
- `exerciseKey` is the composite key (`"e{id}"` for global, `"c{id}"` for custom)
- Queries `workoutExercises` → `workouts` (filtered by userId) → left join `sets`, filtered to the specific exercise
- Aggregates `MAX(sets.weight)` per workout, ordered by `workouts.startedAt ASC`
- Formats `startedAt` as `"dd.MM.yyyy"` string and parses weight to float

Return type:
```ts
export type ExerciseProgressPoint = {
  date: string       // formatted "dd.MM.yyyy" for display on XAxis
  maxWeight: number  // parsed float
}
```

---

## Navigation Map

```
/dashboard
  ├── → /workout              (Workout button)
  ├── → /workout/[id]         (Pencil icon on each card)
  ├── → /exercises            (Exercises link)
  └── → /analytics/exercises  (Analytics link)

/workout
  ├── → /dashboard            (back button)
  └── → /exercises            (link)

/workout/[id]
  └── → /dashboard            (back button)

/exercises
  └── → /dashboard            (back button)

/analytics/exercises
  └── → /dashboard            (back button)
```
