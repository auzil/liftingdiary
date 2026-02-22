"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  getActiveWorkoutByUserId,
  createWorkout,
  completeWorkout,
  updateWorkoutName,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  addSet,
  updateSet,
  deleteSet,
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

export async function addExerciseToWorkoutAction(
  workoutId: number,
  exerciseId: number | null,
  customExerciseId?: number,
) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await addExerciseToWorkout(workoutId, userId, exerciseId, customExerciseId)
  revalidatePath("/workout")
}

export async function removeExerciseFromWorkoutAction(workoutExerciseId: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await removeExerciseFromWorkout(workoutExerciseId, userId)
  revalidatePath("/workout")
}

export async function addSetAction(workoutExerciseId: number, reps: number, weight: string) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await addSet(workoutExerciseId, userId, reps, weight)
  revalidatePath("/workout")
}

export async function updateSetAction(setId: number, reps: number, weight: string) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await updateSet(setId, userId, reps, weight)
  revalidatePath("/workout")
}

export async function deleteSetAction(setId: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await deleteSet(setId, userId)
  revalidatePath("/workout")
}
