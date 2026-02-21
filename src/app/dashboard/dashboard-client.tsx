"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dumbbell, Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkoutWithDetails } from "@/services/workouts"

type DateRange = "week" | "month" | "year"

type ActiveFilter =
  | { kind: "preset"; range: DateRange }
  | { kind: "exact"; date: Date }

function totalSets(workout: WorkoutWithDetails): number {
  return workout.workoutExercises.reduce((acc, we) => acc + we.sets.length, 0)
}

function durationMinutes(workout: WorkoutWithDetails): number | null {
  if (!workout.completedAt) return null
  const diff = workout.completedAt.getTime() - workout.startedAt.getTime()
  return Math.round(diff / 60000)
}

const PRESETS: { value: DateRange; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
]

export function DashboardClient({ workouts }: { workouts: WorkoutWithDetails[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const range = searchParams.get("range") ?? "week"
  const dateParam = searchParams.get("date")
  const activeFilter: ActiveFilter = dateParam
    ? { kind: "exact", date: new Date(dateParam) }
    : { kind: "preset", range: range as DateRange }

  function applyFilter(filter: ActiveFilter) {
    const params = new URLSearchParams(searchParams.toString())
    if (filter.kind === "preset") {
      params.set("range", filter.range)
      params.delete("date")
    } else {
      params.set("date", format(filter.date, "yyyy-MM-dd"))
      params.delete("range")
    }
    router.replace(`?${params}`)
  }

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
            onClick={() => applyFilter({ kind: "preset", range: value })}
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
          <PopoverContent id="calendar-popover" className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={activeFilter.kind === "exact" ? activeFilter.date : undefined}
              onSelect={(date) => {
                if (date) {
                  applyFilter({ kind: "exact", date })
                  setCalendarOpen(false)
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Separator />

      {workouts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No workouts in this period.
        </p>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => {
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
                    {workout.workoutExercises.map((we) => (
                      <Badge key={we.id} variant="outline" className="text-xs font-normal">
                        {we.exercise.name} × {we.sets.length}
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
