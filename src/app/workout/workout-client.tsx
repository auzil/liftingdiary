"use client"

import { useState, useEffect, useTransition } from "react"
import { format } from "date-fns"
import { Dumbbell, Play, Timer, CheckCircle2, Calendar as CalendarIcon, Clock, Save, ArrowLeft } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { startWorkoutAction, finishWorkoutAction, updateWorkoutNameAction } from "@/actions/workouts"
import type { WorkoutSession } from "@/services/workouts"

interface Props {
  latestWorkout: WorkoutSession | null
}

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function WorkoutClient({ latestWorkout }: Props) {
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

  // Name editing for idle state
  const [nameValue, setNameValue] = useState(latestWorkout?.name ?? "")
  const [saving, setSaving] = useState(false)
  async function handleSaveName() {
    setSaving(true)
    await updateWorkoutNameAction(latestWorkout!.id, nameValue)
    setSaving(false)
  }

  const backButton = (
    <Button variant="ghost" size="sm" className="absolute top-4 left-4 gap-1.5" asChild>
      <Link href="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>
    </Button>
  )

  // ── Empty state ──────────────────────────────────────────────────────────
  if (state === "empty") {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        {backButton}
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
    )
  }

  // ── Active state ─────────────────────────────────────────────────────────
  if (state === "active") {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        {backButton}
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
          <CardContent className="text-center">
            <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight">
              {formatElapsed(elapsed)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">elapsed</p>
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
    )
  }

  // ── Idle state (completed workout) ───────────────────────────────────────
  const exercises = latestWorkout!.workoutExercises
  const startedAt = new Date(latestWorkout!.startedAt)
  const completedAt = new Date(latestWorkout!.completedAt!)
  const durationSec = Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000)

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {backButton}
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
                    {we.exercise.name}
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
  )
}
