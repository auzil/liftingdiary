"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  getActiveWorkoutByUserId,
  createWorkout,
  completeWorkout,
  updateWorkoutName,
} from "@/services/workouts"

export async function startWorkoutAction() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  // Server-side guard: only one active workout allowed at a time
  const existing = await getActiveWorkoutByUserId(userId)
  if (existing) {
    revalidatePath("/workout")
    return
  }

  await createWorkout(userId)
  revalidatePath("/workout")
}

export async function finishWorkoutAction(workoutId: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await completeWorkout(workoutId, userId)
  revalidatePath("/workout")
}

export async function updateWorkoutNameAction(workoutId: number, name: string) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await updateWorkoutName(workoutId, userId, name)
  revalidatePath("/workout")
}
