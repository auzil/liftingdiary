"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronLeft } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ExerciseAnalytics, ExerciseProgressPoint } from "@/services/exercises"

interface Props {
  exercises: ExerciseAnalytics[]
  progressByExercise: Record<string, ExerciseProgressPoint[]>
}

const chartConfig = {
  maxWeight: {
    label: "Max weight (kg)",
    color: "hsl(var(--chart-1))",
  },
}

export function ExercisesAnalyticsClient({ exercises, progressByExercise }: Props) {
  const [selected, setSelected] = useState<ExerciseAnalytics | null>(null)

  const progress = selected ? (progressByExercise[selected.id] ?? []) : []

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
          <CardTitle>Exercise History</CardTitle>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No exercises logged yet. Start a workout to track your history.
            </p>
          ) : (
            <div className="space-y-1">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="w-full flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50 text-left transition-colors cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{ex.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(ex.lastUsedAt, "dd.MM.yyyy")}
                    </span>
                  </div>
                  {ex.maxWeight !== null && (
                    <Badge variant="secondary">{ex.maxWeight} kg</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>

          {progress.length < 2 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {progress.length === 0
                ? "No sets recorded for this exercise."
                : "Log this exercise in more workouts to see a progress chart."}
            </p>
          ) : (
            <div className="w-full overflow-hidden">
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <LineChart data={progress} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9 }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  width={36}
                  tickFormatter={(v) => `${v}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="oklch(0.646 0.222 41.116)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "oklch(0.646 0.222 41.116)", stroke: "none" }}
                  activeDot={{ r: 5 }}
                  connectNulls={true}
                />
              </LineChart>
            </ChartContainer>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
