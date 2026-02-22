"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createCustomExercise, updateCustomExercise, deleteCustomExercise } from "@/services/exercises"

export async function createCustomExerciseAction(name: string) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await createCustomExercise(userId, name)
  revalidatePath("/exercises")
  revalidatePath("/workout")
}

export async function updateCustomExerciseAction(id: number, name: string) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await updateCustomExercise(id, userId, name)
  revalidatePath("/exercises")
  revalidatePath("/workout")
}

export async function deleteCustomExerciseAction(id: number) {
  const { userId } = await auth()
  if (!userId) redirect("/")
  await deleteCustomExercise(id, userId)
  revalidatePath("/exercises")
  revalidatePath("/workout")
}
