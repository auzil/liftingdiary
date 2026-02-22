import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCustomExercisesByUserId } from "@/services/exercises"
import { ExercisesClient } from "./exercises-client"

export default async function ExercisesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const exercises = await getCustomExercisesByUserId(userId)

  return <ExercisesClient exercises={exercises} />
}
