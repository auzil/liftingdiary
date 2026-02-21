import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getWorkoutsWithDetailsByUserId } from "@/services/workouts"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const workouts = await getWorkoutsWithDetailsByUserId(userId)

  return <DashboardClient workouts={workouts} today={new Date()} />
}
