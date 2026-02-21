import { db } from "@/db"
import { workouts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export type WorkoutWithDetails = Awaited<ReturnType<typeof getWorkoutsWithDetailsByUserId>>[number]

export async function getWorkoutsWithDetailsByUserId(userId: string) {
  return db.query.workouts.findMany({
    where: eq(workouts.userId, userId),
    orderBy: desc(workouts.date),
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
