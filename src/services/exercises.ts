import { db } from "@/db"
import { customExercises, exercises, workoutExercises, workouts, sets } from "@/db/schema"
import { eq, and, max, asc } from "drizzle-orm"

export type ExerciseProgressPoint = {
  date: string       // formatted "dd.MM.yyyy" for display
  maxWeight: number  // parsed float
}

export async function getExerciseProgressByUserId(
  userId: string,
  exerciseKey: string, // "e{id}" | "c{id}"
): Promise<ExerciseProgressPoint[]> {
  const isCustom = exerciseKey.startsWith("c")
  const numericId = parseInt(exerciseKey.slice(1), 10)

  const rows = await db
    .select({
      startedAt: workouts.startedAt,
      maxWeight: max(sets.weight),
    })
    .from(workoutExercises)
    .innerJoin(
      workouts,
      and(eq(workoutExercises.workoutId, workouts.id), eq(workouts.userId, userId)),
    )
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      isCustom
        ? eq(workoutExercises.customExerciseId, numericId)
        : eq(workoutExercises.exerciseId, numericId),
    )
    .groupBy(workouts.id, workouts.startedAt)
    .orderBy(asc(workouts.startedAt))

  return rows
    .filter((r) => r.maxWeight !== null)
    .map((r) => ({
      date: r.startedAt.toLocaleDateString("en-GB").replace(/\//g, "."),
      maxWeight: parseFloat(r.maxWeight as string),
    }))
}

export type ExerciseAnalytics = {
  id: string           // composite key: "e{id}" | "c{id}"
  name: string
  lastUsedAt: Date
  maxWeight: string | null  // numeric string from DB
}

export async function getExerciseAnalyticsByUserId(userId: string): Promise<ExerciseAnalytics[]> {
  const [globalRows, customRows] = await Promise.all([
    // Global exercises used in this user's workouts
    db
      .select({
        id: exercises.id,
        name: exercises.name,
        lastUsedAt: max(workouts.startedAt),
        maxWeight: max(sets.weight),
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .innerJoin(workouts, and(eq(workoutExercises.workoutId, workouts.id), eq(workouts.userId, userId)))
      .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
      .groupBy(exercises.id, exercises.name),

    // Custom exercises used in this user's workouts
    db
      .select({
        id: customExercises.id,
        name: customExercises.name,
        lastUsedAt: max(workouts.startedAt),
        maxWeight: max(sets.weight),
      })
      .from(workoutExercises)
      .innerJoin(customExercises, eq(workoutExercises.customExerciseId, customExercises.id))
      .innerJoin(workouts, and(eq(workoutExercises.workoutId, workouts.id), eq(workouts.userId, userId)))
      .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
      .groupBy(customExercises.id, customExercises.name),
  ])

  const merged: ExerciseAnalytics[] = [
    ...globalRows
      .filter((r) => r.lastUsedAt !== null)
      .map((r) => ({
        id: `e${r.id}`,
        name: r.name,
        lastUsedAt: r.lastUsedAt as Date,
        maxWeight: r.maxWeight,
      })),
    ...customRows
      .filter((r) => r.lastUsedAt !== null)
      .map((r) => ({
        id: `c${r.id}`,
        name: r.name,
        lastUsedAt: r.lastUsedAt as Date,
        maxWeight: r.maxWeight,
      })),
  ]

  return merged.sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
}

export type CustomExercise = typeof customExercises.$inferSelect

export async function getExercisesForUser(userId: string) {
  const [defaults, custom] = await Promise.all([
    db.select().from(exercises).orderBy(exercises.name),
    db.select().from(customExercises).where(eq(customExercises.userId, userId)).orderBy(customExercises.name),
  ])
  return [
    ...defaults.map((e) => ({ ...e, isCustom: false as const })),
    ...custom.map((e) => ({ ...e, isCustom: true as const })),
  ].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createCustomExercise(userId: string, name: string) {
  const [row] = await db
    .insert(customExercises)
    .values({ userId, name: name.trim() })
    .returning()
  return row
}

export async function updateCustomExercise(id: number, userId: string, name: string) {
  await db
    .update(customExercises)
    .set({ name: name.trim() })
    .where(and(eq(customExercises.id, id), eq(customExercises.userId, userId)))
}

export async function deleteCustomExercise(id: number, userId: string) {
  await db
    .delete(customExercises)
    .where(and(eq(customExercises.id, id), eq(customExercises.userId, userId)))
  // DB cascade removes workoutExercises (and their sets) automatically
}

export async function getCustomExercisesByUserId(userId: string): Promise<CustomExercise[]> {
  return db
    .select()
    .from(customExercises)
    .where(eq(customExercises.userId, userId))
    .orderBy(customExercises.name)
}
