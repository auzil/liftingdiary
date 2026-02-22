import { db } from "@/db"
import { customExercises, exercises } from "@/db/schema"
import { eq, and } from "drizzle-orm"

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
