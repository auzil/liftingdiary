import { db } from "@/db"
import { workouts } from "@/db/schema"
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
          sets: {
            orderBy: (s, { asc }) => [asc(s.setNumber)],
          },
        },
      },
    },
  })
}
