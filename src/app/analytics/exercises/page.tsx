import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getExerciseAnalyticsByUserId, getExerciseProgressByUserId } from "@/services/exercises"
import { ExercisesAnalyticsClient } from "./exercises-analytics-client"

export default async function ExercisesAnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const analytics = await getExerciseAnalyticsByUserId(userId)

  const progressEntries = await Promise.all(
    analytics.map(async (ex) => {
      const points = await getExerciseProgressByUserId(userId, ex.id)
      return [ex.id, points] as const
    }),
  )
  const progressByExercise = Object.fromEntries(progressEntries)

  return (
    <ExercisesAnalyticsClient
      exercises={analytics}
      progressByExercise={progressByExercise}
    />
  )
}
