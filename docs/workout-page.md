# Workout Session Page (`/workout`)

## Feature Overview

The `/workout` route provides a dedicated page for managing a live workout session. It always displays the **most recent workout** for the authenticated user. The UI adapts to one of three states derived from that single record:

- **empty** — no workouts exist yet; show a Start button with an empty illustration
- **active** — a workout is in progress (`completedAt IS NULL`); show a live timer and a Finish button
- **idle** — the latest workout is completed (`completedAt IS NOT NULL`); show workout summary, an editable name field, and a Start New Workout button

Only one workout can be active at a time — enforced at both the UI level and the server-action level.

---

## File Map

| File | Role |
|---|---|
| `src/services/workouts.ts` | Extended with 5 new functions + `WorkoutSession` type |
| `src/actions/workouts.ts` | Server Actions for start / finish / rename mutations |
| `src/app/workout/page.tsx` | Server Component — auth, data fetch, passes prop to client |
| `src/app/workout/workout-client.tsx` | Client Component — renders all three states, handles mutations |
| `src/components/ui/input.tsx` | shadcn Input — installed for the name editing field |

---

## State Machine

| `latestWorkout` value | State | What renders |
|---|---|---|
| `null` | **empty** | Dumbbell icon + "No workouts yet" + Start Workout button |
| `completedAt === null` | **active** | Live elapsed timer (HH:MM:SS) + Finish Workout button |
| `completedAt !== null` | **idle** | Duration, editable name Input + Save, exercise Badge pills, Start New Workout button |

State is derived with a single expression — there is no `useState` for the state machine:

```ts
const state =
  latestWorkout === null ? "empty"
  : latestWorkout.completedAt === null ? "active"
  : "idle"
```

---

## Service Functions (`src/services/workouts.ts`)

| Function | Purpose | Key query detail |
|---|---|---|
| `getLatestWorkoutByUserId(userId)` | Fetch the single most-recent workout with full relations | `findFirst` ordered by `startedAt DESC`; returns `null` (not `undefined`) via `?? null` |
| `getActiveWorkoutByUserId(userId)` | Check whether a workout with `completedAt IS NULL` exists | Used only inside `startWorkoutAction` guard |
| `createWorkout(userId)` | Insert a new workout row | `startedAt: new Date()` required; `date` defaults to `CURRENT_DATE` in schema |
| `completeWorkout(workoutId, userId)` | Set `completedAt = NOW()` | Scoped by both `workoutId` AND `userId` for security |
| `updateWorkoutName(workoutId, userId, name)` | Persist workout name | `name.trim() \|\| null` — empty string stored as `NULL` to match nullable column |

Exported type:
```ts
export type WorkoutSession = NonNullable<Awaited<ReturnType<typeof getLatestWorkoutByUserId>>>
```

---

## Server Actions (`src/actions/workouts.ts`)

| Action | Auth guard | Mutation | Revalidates |
|---|---|---|---|
| `startWorkoutAction()` | `redirect("/")` if no userId | Calls `getActiveWorkoutByUserId` first — returns early if active workout exists; otherwise calls `createWorkout` | `/workout` |
| `finishWorkoutAction(workoutId)` | `redirect("/")` if no userId | Calls `completeWorkout(workoutId, userId)` | `/workout` |
| `updateWorkoutNameAction(workoutId, name)` | `redirect("/")` if no userId | Calls `updateWorkoutName(workoutId, userId, name)` | `/workout` |

---

## UI Components

### Empty state

| Element | Component | Variant |
|---|---|---|
| Wrapper | `Card`, `CardHeader`, `CardFooter` | — |
| Icon container | Inline `div` with `bg-muted` | — |
| Dumbbell icon | `Dumbbell` from `lucide-react` | — |
| Title / description | `CardTitle`, `CardDescription` | — |
| Start button | `Button` | `default` |

### Active state

| Element | Component | Variant |
|---|---|---|
| Wrapper | `Card`, `CardHeader`, `CardContent`, `CardFooter` | — |
| Status chip | `Badge` | `default` |
| Timer display | Monospace `<p>` (Tailwind `font-mono`) | — |
| Finish button | `Button` | `destructive` |

### Idle state

| Element | Component | Variant |
|---|---|---|
| Status chip | `Badge` | `secondary` |
| Duration row | `Clock` icon + text | — |
| Dividers | `Separator` | — |
| Name field | `Input` | — |
| Save button | `Button` | `outline`, `size="sm"` |
| Exercise pills | `Badge` | `outline` |
| Start New button | `Button` | `default` |

---

## "One Active Workout" Constraint

Enforced at two layers:

1. **UI level** — the Start Workout button is absent from the DOM entirely when `state === "active"`. A user sees only the Finish button.

2. **Server-action level** — `startWorkoutAction` calls `getActiveWorkoutByUserId` before every insert. If a row with `completedAt IS NULL` already exists (e.g. from a concurrent tab or a double-click race), the action returns early without inserting. Only then is `revalidatePath` called so the client syncs to the existing active workout.

---

## Key Pitfalls

### `date` column returns as a string

Drizzle maps a Postgres `date` column to a `"yyyy-MM-dd"` JavaScript string, not a `Date` object. Always wrap it before formatting:

```ts
format(new Date(latestWorkout.date), "dd.MM.yyyy")  // ✅
format(latestWorkout.date, "dd.MM.yyyy")             // ❌ TypeScript error
```

`startedAt` and `completedAt` are `timestamp` columns — Drizzle returns these as `Date` objects directly.

### `useTransition` async pattern in React 19

React 19's `useTransition` accepts async callbacks, so Server Actions can be awaited inline inside `startTransition`:

```ts
const [pending, startTransition] = useTransition()
const handleStart = () => startTransition(async () => { await startWorkoutAction() })
```

The `pending` boolean covers the full async span — no extra `useState` needed for loading state on these buttons.

### `useEffect` dep on primitive `id`, not object reference

The live timer effect depends on `latestWorkout?.id` (a number), not on the `latestWorkout` object itself:

```ts
useEffect(() => {
  // ...
}, [latestWorkout?.id])  // ← NOT [latestWorkout]
```

After `revalidatePath` triggers a re-render, `latestWorkout` is a new object reference even though the workout hasn't changed. Using the primitive `id` prevents the timer from resetting mid-session. The `react-hooks/exhaustive-deps` warning is suppressed intentionally with a comment.
