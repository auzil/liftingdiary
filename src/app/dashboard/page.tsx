import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns"
import { getWorkoutsWithDetailsByUserId, getActiveWorkoutByUserId } from "@/services/workouts"
import { DashboardClient } from "./dashboard-client"

type DateRange = "week" | "month" | "year"

function getDateRange(range: DateRange, now: Date): { start: Date; end: Date } {
  switch (range) {
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; date?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const params = await searchParams
  const now = new Date()
  const dateRange = params.date
    ? { start: startOfDay(new Date(params.date)), end: endOfDay(new Date(params.date)) }
    : getDateRange((params.range ?? "week") as DateRange, now)

  const [workouts, activeWorkout] = await Promise.all([
    getWorkoutsWithDetailsByUserId(userId, dateRange),
    getActiveWorkoutByUserId(userId),
  ])

  return (
    <Suspense>
      <DashboardClient
        workouts={workouts}
        activeWorkoutStartedAt={activeWorkout?.startedAt ?? null}
      />
    </Suspense>
  )
}
