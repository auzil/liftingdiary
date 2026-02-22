import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getWorkoutByIdForUser } from "@/services/workouts"
import { getExercisesForUser } from "@/services/exercises"
import { WorkoutEditClient } from "./workout-edit-client"

export default async function WorkoutEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const { id } = await params
  const workoutId = parseInt(id, 10)
  if (isNaN(workoutId)) notFound()

  const [workout, allExercises] = await Promise.all([
    getWorkoutByIdForUser(workoutId, userId),
    getExercisesForUser(userId),
  ])

  if (!workout) notFound()

  return <WorkoutEditClient workout={workout} allExercises={allExercises} />
}
