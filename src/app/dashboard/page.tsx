"use client"

import { useState } from "react"
import {
  format,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dumbbell, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type DateRange = "week" | "month" | "year"

type ActiveFilter =
  | { kind: "preset"; range: DateRange }
  | { kind: "exact"; date: Date }

type MockSet = { reps: number; weight: number }
type MockExercise = { name: string; sets: MockSet[] }
type MockWorkout = {
  id: number
  name: string
  date: string
  startedAt: string
  completedAt: string | null
  exercises: MockExercise[]
}

const MOCK_WORKOUTS: MockWorkout[] = [
  {
    id: 1,
    name: "Push Day",
    date: "2026-02-19",
    startedAt: "2026-02-19T09:00:00",
    completedAt: "2026-02-19T10:30:00",
    exercises: [
      { name: "Bench Press", sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 6, weight: 85 }] },
      { name: "Overhead Press", sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 52.5 }] },
      { name: "Tricep Pushdown", sets: [{ reps: 12, weight: 30 }, { reps: 12, weight: 30 }] },
    ],
  },
  {
    id: 2,
    name: "Pull Day",
    date: "2026-02-17",
    startedAt: "2026-02-17T08:30:00",
    completedAt: "2026-02-17T09:45:00",
    exercises: [
      { name: "Deadlift", sets: [{ reps: 5, weight: 140 }, { reps: 5, weight: 145 }, { reps: 3, weight: 150 }] },
      { name: "Pull Up", sets: [{ reps: 8, weight: 0 }, { reps: 7, weight: 0 }] },
    ],
  },
  {
    id: 3,
    name: "Leg Day",
    date: "2026-02-14",
    startedAt: "2026-02-14T10:00:00",
    completedAt: "2026-02-14T11:20:00",
    exercises: [
      { name: "Squat", sets: [{ reps: 5, weight: 120 }, { reps: 5, weight: 120 }, { reps: 5, weight: 125 }] },
      { name: "Leg Press", sets: [{ reps: 10, weight: 200 }, { reps: 10, weight: 200 }] },
      { name: "Leg Curl", sets: [{ reps: 12, weight: 60 }, { reps: 12, weight: 60 }] },
    ],
  },
  {
    id: 4,
    name: "Upper Body",
    date: "2026-02-10",
    startedAt: "2026-02-10T09:00:00",
    completedAt: "2026-02-10T10:15:00",
    exercises: [
      { name: "Incline Bench Press", sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 72.5 }] },
      { name: "Barbell Row", sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 82.5 }] },
    ],
  },
  {
    id: 5,
    name: "Full Body",
    date: "2026-01-25",
    startedAt: "2026-01-25T08:00:00",
    completedAt: "2026-01-25T09:30:00",
    exercises: [
      { name: "Squat", sets: [{ reps: 5, weight: 115 }, { reps: 5, weight: 115 }] },
      { name: "Bench Press", sets: [{ reps: 8, weight: 75 }, { reps: 8, weight: 75 }] },
      { name: "Deadlift", sets: [{ reps: 3, weight: 135 }] },
    ],
  },
  {
    id: 6,
    name: "Push Day",
    date: "2026-01-15",
    startedAt: "2026-01-15T10:00:00",
    completedAt: "2026-01-15T11:00:00",
    exercises: [
      { name: "Bench Press", sets: [{ reps: 8, weight: 77.5 }, { reps: 8, weight: 77.5 }] },
      { name: "Overhead Press", sets: [{ reps: 10, weight: 47.5 }, { reps: 10, weight: 47.5 }] },
    ],
  },
  {
    id: 7,
    name: "Back Day",
    date: "2025-12-10",
    startedAt: "2025-12-10T09:00:00",
    completedAt: "2025-12-10T10:15:00",
    exercises: [
      { name: "Deadlift", sets: [{ reps: 5, weight: 130 }, { reps: 5, weight: 130 }] },
      { name: "Pull Up", sets: [{ reps: 6, weight: 0 }, { reps: 5, weight: 0 }] },
    ],
  },
]

function totalSets(workout: MockWorkout): number {
  return workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
}

function durationMinutes(workout: MockWorkout): number | null {
  if (!workout.completedAt) return null
  const diff = new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()
  return Math.round(diff / 60000)
}

// TODO(human): implement this function.
// Given a DateRange value ("week" | "month" | "year"), return { start: Date, end: Date }
// representing the boundaries of the current period.
// date-fns helpers are already imported above — use them.
// Hint: startOfWeek defaults to Sunday; pass { weekStartsOn: 1 } for Monday.
function getDateRange(range: DateRange): { start: Date; end: Date } {
  void range
  void startOfWeek
  void endOfWeek
  void startOfMonth
  void endOfMonth
  void startOfYear
  void endOfYear
  return { start: new Date(0), end: new Date() } // placeholder: shows all workouts
}

const PRESETS: { value: DateRange; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
]

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({ kind: "preset", range: "week" })
  const [calendarOpen, setCalendarOpen] = useState(false)

  const { start, end } =
    activeFilter.kind === "exact"
      ? { start: startOfDay(activeFilter.date), end: endOfDay(activeFilter.date) }
      : getDateRange(activeFilter.range)

  const filtered = MOCK_WORKOUTS.filter((w) =>
    isWithinInterval(new Date(w.date), { start, end })
  )

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your workout history</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map(({ value, label }) => (
          <Button
            key={value}
            variant={activeFilter.kind === "preset" && activeFilter.range === value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter({ kind: "preset", range: value })}
          >
            {label}
          </Button>
        ))}

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilter.kind === "exact" ? "default" : "outline"}
              size="sm"
              className={cn("gap-1.5", activeFilter.kind !== "exact" && "text-muted-foreground")}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {activeFilter.kind === "exact"
                ? format(activeFilter.date, "dd.MM.yyyy")
                : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={activeFilter.kind === "exact" ? activeFilter.date : undefined}
              onSelect={(date) => {
                if (date) {
                  setActiveFilter({ kind: "exact", date })
                  setCalendarOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No workouts in this period.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((workout) => {
            const duration = durationMinutes(workout)
            return (
              <Card key={workout.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {workout.name ?? "Untitled Workout"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {format(new Date(workout.date), "dd.MM.yyyy")}
                        {duration !== null && (
                          <>
                            <span className="opacity-40">·</span>
                            <Clock className="h-3.5 w-3.5" />
                            {duration} min
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {totalSets(workout)} sets
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {workout.exercises.map((ex) => (
                      <Badge key={ex.name} variant="outline" className="text-xs font-normal">
                        {ex.name} × {ex.sets.length}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
