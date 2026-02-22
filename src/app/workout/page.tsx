import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getLatestWorkoutByUserId } from "@/services/workouts"
import { getExercisesForUser } from "@/services/exercises"
import { WorkoutClient } from "./workout-client"

export default async function WorkoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const [latestWorkout, allExercises] = await Promise.all([
    getLatestWorkoutByUserId(userId),
    getExercisesForUser(userId),
  ])

  return <WorkoutClient latestWorkout={latestWorkout} allExercises={allExercises} />
}
