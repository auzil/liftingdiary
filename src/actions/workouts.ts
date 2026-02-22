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

function revalidateWorkout(revalidateId?: number) {
  revalidatePath("/workout")
  if (revalidateId !== undefined) revalidatePath(`/workout/${revalidateId}`)
}

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

export async function updateWorkoutNameAction(workoutId: number, name: string, revalidateId?: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await updateWorkoutName(workoutId, userId, name)
  revalidateWorkout(revalidateId)
}

export async function addExerciseToWorkoutAction(
  workoutId: number,
  exerciseId: number | null,
  customExerciseId?: number,
  revalidateId?: number,
) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await addExerciseToWorkout(workoutId, userId, exerciseId, customExerciseId)
  revalidateWorkout(revalidateId)
}

export async function removeExerciseFromWorkoutAction(workoutExerciseId: number, revalidateId?: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await removeExerciseFromWorkout(workoutExerciseId, userId)
  revalidateWorkout(revalidateId)
}

export async function addSetAction(workoutExerciseId: number, reps: number, weight: string, revalidateId?: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await addSet(workoutExerciseId, userId, reps, weight)
  revalidateWorkout(revalidateId)
}

export async function updateSetAction(setId: number, reps: number, weight: string, revalidateId?: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await updateSet(setId, userId, reps, weight)
  revalidateWorkout(revalidateId)
}

export async function deleteSetAction(setId: number, revalidateId?: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await deleteSet(setId, userId)
  revalidateWorkout(revalidateId)
}
