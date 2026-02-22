"use client"

import { useState, useTransition } from "react"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createCustomExerciseAction,
  updateCustomExerciseAction,
  deleteCustomExerciseAction,
} from "@/actions/exercises"
import type { CustomExercise } from "@/services/exercises"

interface Props {
  exercises: CustomExercise[]
}

export function ExercisesClient({ exercises }: Props) {
  const [pending, startTransition] = useTransition()

  // New exercise dialog
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState("")

  // Edit exercise dialog
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraftName, setEditDraftName] = useState("")

  // Delete confirmation dialog
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function openEdit(ex: CustomExercise) {
    setEditingId(ex.id)
    setEditDraftName(ex.name)
  }

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setNewOpen(false)
    setNewName("")
    startTransition(async () => {
      await createCustomExerciseAction(trimmed)
    })
  }

  function handleUpdate() {
    const trimmed = editDraftName.trim()
    if (!trimmed || editingId === null) return
    const id = editingId
    setEditingId(null)
    startTransition(async () => {
      await updateCustomExerciseAction(id, trimmed)
    })
  }

  function handleDelete() {
    if (deletingId === null) return
    const id = deletingId
    setDeletingId(null)
    startTransition(async () => {
      await deleteCustomExerciseAction(id)
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-4 pt-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Exercises</CardTitle>
            <Button size="sm" onClick={() => { setNewName(""); setNewOpen(true) }} disabled={pending}>
              <Plus className="mr-1 h-4 w-4" />
              New Exercise
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No custom exercises yet. Add your first one.
            </p>
          ) : (
            <div className="space-y-1">
              {exercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50">
                  <span className="text-sm">{ex.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      disabled={pending}
                      onClick={() => openEdit(ex)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      disabled={pending}
                      onClick={() => setDeletingId(ex.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New exercise dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Exercise</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Exercise name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit exercise dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Exercise name"
            value={editDraftName}
            onChange={(e) => setEditDraftName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleUpdate() }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!editDraftName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exercise and remove it from any workouts where it was logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
