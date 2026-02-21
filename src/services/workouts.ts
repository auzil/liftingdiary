import { db } from "@/db"
import { workouts } from "@/db/schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import { format } from "date-fns"

export type WorkoutWithDetails = Awaited<ReturnType<typeof getWorkoutsWithDetailsByUserId>>[number]

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
