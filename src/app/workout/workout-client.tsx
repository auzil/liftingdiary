"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Dumbbell, Play, Timer, CheckCircle2, Calendar as CalendarIcon, Clock, Save, Plus, Trash2, X, ChevronLeft } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  startWorkoutAction,
  finishWorkoutAction,
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
  latestWorkout: WorkoutSession | null
  allExercises: ExerciseOption[]
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function WorkoutClient({ latestWorkout, allExercises }: Props) {
  const state =
    latestWorkout === null
      ? "empty"
      : latestWorkout.completedAt === null
      ? "active"
      : "idle"

  // Live timer for active state
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (state !== "active" || !latestWorkout) return
    const origin = new Date(latestWorkout.startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - origin) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestWorkout?.id]) // primitive id — avoids restarting timer on object reference change

  // Transition for start / finish mutations
  const [pending, startTransition] = useTransition()
  const handleStart = () =>
    startTransition(async () => {
      await startWorkoutAction()
    })
  const handleFinish = () =>
    startTransition(async () => {
      await finishWorkoutAction(latestWorkout!.id)
    })

  // Transition for exercise / set mutations
  const [mutating, startMutation] = useTransition()

  // Exercise picker popover
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false)

  // Set draft values (keyed by setId) for inline editing
  const [setDrafts, setSetDrafts] = useState<Record<number, { reps: string; weight: string }>>({})

  // Name editing for idle state
  const [nameValue, setNameValue] = useState(latestWorkout?.name ?? "")
  const [saving, setSaving] = useState(false)
  async function handleSaveName() {
    setSaving(true)
    await updateWorkoutNameAction(latestWorkout!.id, nameValue)
    setSaving(false)
  }

  // Derived: which exercises are already added (track by id + isCustom key)
  const addedKeys = new Set(
    latestWorkout?.workoutExercises.map((we) =>
      we.customExerciseId != null ? `c${we.customExerciseId}` : `e${we.exerciseId}`
    ) ?? []
  )
  const availableExercises = allExercises.filter((ex) =>
    !addedKeys.has(ex.isCustom ? `c${ex.id}` : `e${ex.id}`)
  )

  // Set draft helpers
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
      await updateSetAction(setId, reps, String(weight))
    })
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (state === "empty") {
    return (
      <div className="flex min-h-screen items-start justify-center p-4 pt-8">
        <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" size="sm" asChild className="md:hidden -ml-2">
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Dumbbell className="h-7 w-7 text-muted-foreground" />
            </div>
            <CardTitle>No workouts yet</CardTitle>
            <CardDescription>Start your first session to begin tracking your lifts.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={handleStart} disabled={pending}>
              <Play className="mr-2 h-4 w-4" />
              {pending ? "Starting…" : "Start Workout"}
            </Button>
          </CardFooter>
        </Card>
        </div>
      </div>
    )
  }

  // ── Active state ─────────────────────────────────────────────────────────
  if (state === "active") {
    const workoutExerciseList = latestWorkout!.workoutExercises

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
              <CardTitle className="text-xl">Workout in progress</CardTitle>
              <Badge>
                <Timer className="mr-1 h-3 w-3" />
                Live
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              {format(new Date(latestWorkout!.date), "dd.MM.yyyy")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Timer */}
            <div className="text-center">
              <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
                {formatElapsed(elapsed)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">elapsed</p>
            </div>

            <Separator />

            {/* Exercise list */}
            {workoutExerciseList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">No exercises yet. Add one below.</p>
            ) : (
              <div className="space-y-4">
                {workoutExerciseList.map((we) => (
                  <div key={we.id} className="space-y-2">
                    {/* Exercise name + remove button */}
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{we.customExercise?.name ?? we.exercise?.name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        disabled={mutating}
                        onClick={() =>
                          startMutation(async () => {
                            await removeExerciseFromWorkoutAction(we.id)
                          })
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Set rows */}
                    {we.sets.length > 0 && (
                      <div className="space-y-1">
                        {/* Column headers */}
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
                                  await deleteSetAction(s.id)
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
                                .filter((snap) => !isNaN(snap.reps) && !isNaN(snap.weight) && snap.reps >= 0 && snap.weight >= 0)

                              setSetDrafts((prev) => {
                                const next = { ...prev }
                                we.sets.forEach((s) => delete next[s.id])
                                return next
                              })

                              startMutation(async () => {
                                await Promise.all(dirtySnapshots.map((snap) => updateSetAction(snap.id, snap.reps, String(snap.weight))))
                              })
                            } else {
                              const last = we.sets.at(-1)
                              startMutation(async () => {
                                await addSetAction(we.id, last?.reps ?? 1, last?.weight ?? "0")
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
                            latestWorkout!.id,
                            ex.isCustom ? null : ex.id,
                            ex.isCustom ? ex.id : undefined,
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

          <CardFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleFinish}
              disabled={pending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pending ? "Finishing…" : "Finish Workout"}
            </Button>
          </CardFooter>
        </Card>
        </div>
      </div>
    )
  }

  // ── Idle state (completed workout) ───────────────────────────────────────
  const exercises = latestWorkout!.workoutExercises
  const startedAt = new Date(latestWorkout!.startedAt)
  const completedAt = new Date(latestWorkout!.completedAt!)
  const durationSec = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

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
            <CardTitle className="text-xl">Last Workout</CardTitle>
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Done
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {format(new Date(latestWorkout!.date), "dd.MM.yyyy")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duration: {formatElapsed(durationSec)}</span>
          </div>

          <Separator />

          {/* Editable name */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Workout name</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Push Day A"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveName}
                disabled={saving}
              >
                <Save className="mr-1 h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Exercise summary */}
          {exercises.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Exercises</p>
              <div className="flex flex-wrap gap-1.5">
                {exercises.map((we) => (
                  <Badge key={we.id} variant="outline">
                    <Dumbbell className="mr-1 h-3 w-3" />
                    {we.customExercise?.name ?? we.exercise?.name}
                    <span className="ml-1 text-muted-foreground">
                      {we.sets.length}×
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No exercises recorded.</p>
          )}
        </CardContent>

        <CardFooter>
          <Button className="w-full" onClick={handleStart} disabled={pending}>
            <Play className="mr-2 h-4 w-4" />
            {pending ? "Starting…" : "Start New Workout"}
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  )
}
