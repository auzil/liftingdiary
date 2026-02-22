import { db } from "@/db"
import { workouts, exercises, workoutExercises, sets } from "@/db/schema"
import { eq, desc, and, gte, lte, isNull } from "drizzle-orm"
import { format } from "date-fns"

export type WorkoutWithDetails = Awaited<ReturnType<typeof getWorkoutsWithDetailsByUserId>>[number]

export async function getLatestWorkoutByUserId(userId: string) {
  return (await db.query.workouts.findFirst({
    where: eq(workouts.userId, userId),
    orderBy: desc(workouts.startedAt),
    with: {
      workoutExercises: {
        orderBy: (we, { asc }) => [asc(we.orderIndex)],
        with: {
          exercise: true,
          customExercise: true,
          sets: { orderBy: (s, { asc }) => [asc(s.setNumber)] },
        },
      },
    },
  })) ?? null
}

export type WorkoutSession = NonNullable<Awaited<ReturnType<typeof getLatestWorkoutByUserId>>>

export async function getActiveWorkoutByUserId(userId: string) {
  return (await db.query.workouts.findFirst({
    where: and(eq(workouts.userId, userId), isNull(workouts.completedAt)),
  })) ?? null
}

export async function createWorkout(userId: string) {
  const [row] = await db
    .insert(workouts)
    .values({ userId, startedAt: new Date() })
    .returning({ id: workouts.id })
  return row
}

export async function completeWorkout(workoutId: number, userId: string) {
  await db
    .update(workouts)
    .set({ completedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
}

export async function updateWorkoutName(workoutId: number, userId: string, name: string) {
  await db
    .update(workouts)
    .set({ name: name.trim() || null })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
}

// ── Exercises catalog ─────────────────────────────────────────────────────

export type Exercise = typeof exercises.$inferSelect

// ── Workout-exercise mutations ────────────────────────────────────────────

export async function addExerciseToWorkout(
  workoutId: number,
  userId: string,
  exerciseId: number | null,
  customExerciseId?: number,
) {
  const workout = await db.query.workouts.findFirst({
    where: and(eq(workouts.id, workoutId), eq(workouts.userId, userId)),
  })
  if (!workout) return

  const existing = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workoutId))
  const nextIndex = existing.length

  await db.insert(workoutExercises).values({ workoutId, exerciseId, customExerciseId, orderIndex: nextIndex })
}

export async function removeExerciseFromWorkout(workoutExerciseId: number, userId: string) {
  const we = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true },
  })
  if (!we || we.workout.userId !== userId) return

  await db.delete(workoutExercises).where(eq(workoutExercises.id, workoutExerciseId))
}

// ── Set mutations ─────────────────────────────────────────────────────────

export async function addSet(workoutExerciseId: number, userId: string, reps: number, weight: string) {
  const we = await db.query.workoutExercises.findFirst({
    where: eq(workoutExercises.id, workoutExerciseId),
    with: { workout: true },
  })
  if (!we || we.workout.userId !== userId) return

  const existingSets = await db.select().from(sets).where(eq(sets.workoutExerciseId, workoutExerciseId))
  const nextSetNumber = existingSets.length + 1

  await db.insert(sets).values({ workoutExerciseId, setNumber: nextSetNumber, reps, weight })
}

export async function updateSet(setId: number, userId: string, reps: number, weight: string) {
  const s = await db.query.sets.findFirst({
    where: eq(sets.id, setId),
    with: { workoutExercise: { with: { workout: true } } },
  })
  if (!s || s.workoutExercise.workout.userId !== userId) return

  await db.update(sets).set({ reps, weight }).where(eq(sets.id, setId))
}

export async function deleteSet(setId: number, userId: string) {
  const s = await db.query.sets.findFirst({
    where: eq(sets.id, setId),
    with: { workoutExercise: { with: { workout: true } } },
  })
  if (!s || s.workoutExercise.workout.userId !== userId) return

  await db.delete(sets).where(eq(sets.id, setId))
}

// ── Dashboard queries ─────────────────────────────────────────────────────

export async function getWorkoutsWithDetailsByUserId(
  userId: string,
  dateRange?: { start: Date; end: Date }
) {
  return db.query.workouts.findMany({
    where: dateRange
      ? and(
          eq(workouts.userId, userId),
          gte(workouts.date, format(dateRange.start, "yyyy-MM-dd")),
          lte(workouts.date, format(dateRange.end, "yyyy-MM-dd")),
        )
      : eq(workouts.userId, userId),
    orderBy: desc(workouts.completedAt),
    with: {
      workoutExercises: {
        orderBy: (we, { asc }) => [asc(we.orderIndex)],
        with: {
          exercise: true,
          customExercise: true,
          sets: {
            orderBy: (s, { asc }) => [asc(s.setNumber)],
          },
        },
      },
    },
  })
}
