import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getLatestWorkoutByUserId } from "@/services/workouts"
import { WorkoutClient } from "./workout-client"

export default async function WorkoutPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const latestWorkout = await getLatestWorkoutByUserId(userId)

  return <WorkoutClient latestWorkout={latestWorkout} />
}
