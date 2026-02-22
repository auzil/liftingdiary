"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { CalendarIcon, Clock, Dumbbell, Plus, Save, Trash2, X, ChevronLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  updateWorkoutNameAction,
  addExerciseToWorkoutAction,
  removeExerciseFromWorkoutAction,
  addSetAction,
  updateSetAction,
  deleteSetAction,
} from "@/actions/workouts"
import type { WorkoutSession } from "@/services/workouts"

type ExerciseOption = { id: number; name: string; isCustom: boolean }

interface Props {
  workout: WorkoutSession
  allExercises: ExerciseOption[]
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function WorkoutEditClient({ workout, allExercises }: Props) {
  const [mutating, startMutation] = useTransition()
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)
  const [setDrafts, setSetDrafts] = useState<Record<number, { reps: string; weight: string }>>({})
  const [nameValue, setNameValue] = useState(workout.name ?? "")
  const [saving, setSaving] = useState(false)

  const durationSec = workout.completedAt
    ? Math.floor((new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000)
    : null

  const addedKeys = new Set(
    workout.workoutExercises.map((we) =>
      we.customExerciseId != null ? `c${we.customExerciseId}` : `e${we.exerciseId}`
    )
  )
  const availableExercises = allExercises.filter(
    (ex) => !addedKeys.has(ex.isCustom ? `c${ex.id}` : `e${ex.id}`)
  )

  async function handleSaveName() {
    setSaving(true)
    await updateWorkoutNameAction(workout.id, nameValue, workout.id)
    setSaving(false)
  }

  function getDraftReps(setId: number, persisted: number): string {
    return setDrafts[setId]?.reps ?? String(persisted)
  }
  function getDraftWeight(setId: number, persisted: string): string {
    return setDrafts[setId]?.weight ?? persisted
  }
  function handleSetChange(setId: number, field: "reps" | "weight", value: string) {
    setSetDrafts((prev) => ({
      ...prev,
      [setId]: { ...prev[setId], [field]: value },
    }))
  }
  function handleSetBlur(setId: number, persistedReps: number, persistedWeight: string) {
    const repsStr = setDrafts[setId]?.reps ?? String(persistedReps)
    const weightStr = setDrafts[setId]?.weight ?? persistedWeight
    const reps = parseInt(repsStr, 10)
    const weight = parseFloat(weightStr)
    if (isNaN(reps) || isNaN(weight) || reps < 0 || weight < 0) return
    setSetDrafts((prev) => {
      const next = { ...prev }
      delete next[setId]
      return next
    })
    startMutation(async () => {
      await updateSetAction(setId, reps, String(weight), workout.id)
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-8">
      <div className="w-full max-w-md space-y-4">
      <Button variant="ghost" size="sm" asChild className="md:hidden -ml-2">
        <Link href="/dashboard">
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Edit Workout</CardTitle>
            <Badge variant="secondary">
              <Dumbbell className="mr-1 h-3 w-3" />
              {workout.workoutExercises.reduce((acc, we) => acc + we.sets.length, 0)} sets
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(new Date(workout.date), "dd.MM.yyyy")}
            {durationSec !== null && (
              <>
                <span className="opacity-40">·</span>
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(durationSec)}
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Rename */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Workout name</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Push Day A"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
              />
              <Button variant="outline" size="sm" onClick={handleSaveName} disabled={saving}>
                <Save className="mr-1 h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Exercise list */}
          {workout.workoutExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No exercises yet. Add one below.</p>
          ) : (
            <div className="space-y-4">
              {workout.workoutExercises.map((we) => (
                <div key={we.id} className="space-y-2">
                  {/* Exercise name + remove */}
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{we.customExercise?.name ?? we.exercise?.name}</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          disabled={mutating}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove exercise?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <span className="font-medium text-foreground">
                              {we.customExercise?.name ?? we.exercise?.name}
                            </span>{" "}
                            and all its sets will be permanently removed from this workout.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() =>
                              startMutation(async () => {
                                await removeExerciseFromWorkoutAction(we.id, workout.id)
                              })
                            }
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Set rows */}
                  {we.sets.length > 0 && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-1 px-1">
                        <span className="text-xs text-muted-foreground text-center">#</span>
                        <span className="text-xs text-muted-foreground text-center">kg</span>
                        <span className="text-xs text-muted-foreground text-center">reps</span>
                        <span />
                      </div>
                      {we.sets.map((s) => (
                        <div key={s.id} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-1">
                          <span className="text-xs text-muted-foreground text-center tabular-nums">
                            {s.setNumber}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            className="h-8 text-center text-sm"
                            value={getDraftWeight(s.id, s.weight)}
                            onChange={(e) => handleSetChange(s.id, "weight", e.target.value)}
                            onBlur={() => handleSetBlur(s.id, s.reps, s.weight)}
                          />
                          <Input
                            type="number"
                            min={0}
                            className="h-8 text-center text-sm"
                            value={getDraftReps(s.id, s.reps)}
                            onChange={(e) => handleSetChange(s.id, "reps", e.target.value)}
                            onBlur={() => handleSetBlur(s.id, s.reps, s.weight)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={mutating}
                            onClick={() =>
                              startMutation(async () => {
                                await deleteSetAction(s.id, workout.id)
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Set / Save button */}
                  {(() => {
                    const hasDirtySet = we.sets.some((s) => setDrafts[s.id] !== undefined)
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={mutating}
                        onClick={() => {
                          if (hasDirtySet) {
                            const dirtySnapshots = we.sets
                              .filter((s) => setDrafts[s.id] !== undefined)
                              .map((s) => ({
                                id: s.id,
                                reps: parseInt(setDrafts[s.id].reps ?? String(s.reps), 10),
                                weight: parseFloat(setDrafts[s.id].weight ?? s.weight),
                              }))
                              .filter(
                                (snap) =>
                                  !isNaN(snap.reps) && !isNaN(snap.weight) && snap.reps >= 0 && snap.weight >= 0
                              )

                            setSetDrafts((prev) => {
                              const next = { ...prev }
                              we.sets.forEach((s) => delete next[s.id])
                              return next
                            })

                            startMutation(async () => {
                              await Promise.all(
                                dirtySnapshots.map((snap) =>
                                  updateSetAction(snap.id, snap.reps, String(snap.weight), workout.id)
                                )
                              )
                            })
                          } else {
                            const last = we.sets.at(-1)
                            startMutation(async () => {
                              await addSetAction(we.id, last?.reps ?? 1, last?.weight ?? "0", workout.id)
                            })
                          }
                        }}
                      >
                        {hasDirtySet ? (
                          <>
                            <Save className="mr-1 h-3.5 w-3.5" />
                            Save
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            Add Set
                          </>
                        )}
                      </Button>
                    )
                  })()}

                  <Separator />
                </div>
              ))}
            </div>
          )}

          {/* Add Exercise popover */}
          <Popover open={exercisePickerOpen} onOpenChange={setExercisePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                disabled={availableExercises.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                {availableExercises.length === 0 ? "All exercises added" : "Add Exercise"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1" align="center">
              <div className="max-h-64 overflow-y-auto">
                {availableExercises.map((ex) => (
                  <Button
                    key={ex.isCustom ? `c${ex.id}` : `e${ex.id}`}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    disabled={mutating}
                    onClick={() => {
                      setExercisePickerOpen(false)
                      startMutation(async () => {
                        await addExerciseToWorkoutAction(
                          workout.id,
                          ex.isCustom ? null : ex.id,
                          ex.isCustom ? ex.id : undefined,
                          workout.id,
                        )
                      })
                    }}
                  >
                    {ex.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
