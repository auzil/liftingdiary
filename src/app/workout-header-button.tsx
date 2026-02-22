"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":")
}

export function WorkoutHeaderButton({
  activeWorkoutStartedAt,
}: {
  activeWorkoutStartedAt: string | null
}) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeWorkoutStartedAt) return
    const origin = new Date(activeWorkoutStartedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - origin) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeWorkoutStartedAt])

  return (
    <Button
      variant={activeWorkoutStartedAt ? "destructive" : "default"}
      size="sm"
      className="gap-2"
      onClick={() => router.push("/workout")}
    >
      {activeWorkoutStartedAt ? (
        <>
          <Activity className="h-4 w-4" />
          Active · {formatElapsed(elapsed)}
        </>
      ) : (
        <>
          <Dumbbell className="h-4 w-4" />
          Workout
        </>
      )}
    </Button>
  )
}
