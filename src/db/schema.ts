import { pgTable, serial, text, integer, numeric, date, timestamp, index } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// Exercise catalog — shared across all users and workouts
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// A training session belonging to a user
export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name'),
  date: date('date').notNull().default(sql`CURRENT_DATE`),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('workouts_user_id_idx').on(t.userId),
])

// Junction: which exercises appear in a workout, in what order
export const workoutExercises = pgTable('workout_exercises', {
  id: serial('id').primaryKey(),
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  orderIndex: integer('order_index').notNull(),
}, (t) => [
  index('workout_exercises_workout_id_idx').on(t.workoutId),
])

// Individual sets performed for a workout-exercise
export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),
  workoutExerciseId: integer('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Relations — used by Drizzle's relational query API
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}))

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}))

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [workoutExercises.workoutId], references: [workouts.id] }),
  exercise: one(exercises, { fields: [workoutExercises.exerciseId], references: [exercises.id] }),
  sets: many(sets),
}))

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, { fields: [sets.workoutExerciseId], references: [workoutExercises.id] }),
}))
