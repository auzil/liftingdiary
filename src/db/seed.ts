import 'dotenv/config'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const USER_ID = process.env.SEED_USER_ID
if (!USER_ID) throw new Error('SEED_USER_ID env var is required. Add SEED_USER_ID=user_xxx to .env.local')

const db = drizzle(process.env.DATABASE_URL!, { schema })

// --- Exercise catalog ---
const [benchPress, squat, deadlift, ohp, pullUp, barbellRow] = await db
  .insert(schema.exercises)
  .values([
    { name: 'Bench Press' },
    { name: 'Squat' },
    { name: 'Deadlift' },
    { name: 'Overhead Press' },
    { name: 'Pull-up' },
    { name: 'Barbell Row' },
  ])
  .returning()

function d(date: string, hour: number, minute = 0): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)
}

type SetDef = { reps: number; weight: number }
type ExDef = { exerciseId: number; sets: SetDef[] }
type WorkoutDef = {
  name: string
  date: string
  startedAt: Date
  completedAt: Date
  exercises: ExDef[]
}

// 33 workouts: Nov 2025 → Feb 2026, 3×/week Push / Pull / Legs
// Weights increase gradually over time to simulate linear progression
const workoutDefs: WorkoutDef[] = [

  // ── November 2025 ──────────────────────────────────────────────────────────
  {
    name: 'Leg Day', date: '2025-11-15',
    startedAt: d('2025-11-15', 10), completedAt: d('2025-11-15', 11, 10),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 80 }, { reps: 5, weight: 82.5 }, { reps: 5, weight: 82.5 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 102.5 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2025-11-18',
    startedAt: d('2025-11-18', 18), completedAt: d('2025-11-18', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 5, weight: 0 }, { reps: 5, weight: 0 }, { reps: 4, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 45 }, { reps: 10, weight: 45 }, { reps: 8, weight: 47.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2025-11-20',
    startedAt: d('2025-11-20', 7), completedAt: d('2025-11-20', 7, 52),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 65 }, { reps: 8, weight: 65 }, { reps: 6, weight: 67.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 37.5 }, { reps: 10, weight: 37.5 }, { reps: 8, weight: 40 }] },
    ],
  },
  {
    name: 'Full Body', date: '2025-11-25',
    startedAt: d('2025-11-25', 9), completedAt: d('2025-11-25', 10, 25),
    exercises: [
      { exerciseId: squat.id,      sets: [{ reps: 5, weight: 82.5 }, { reps: 5, weight: 85 }, { reps: 5, weight: 85 }] },
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 67.5 }, { reps: 8, weight: 67.5 }, { reps: 6, weight: 70 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 47.5 }, { reps: 10, weight: 47.5 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2025-11-27',
    startedAt: d('2025-11-27', 18), completedAt: d('2025-11-27', 19),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 5, weight: 0 }, { reps: 5, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 47.5 }, { reps: 10, weight: 50 }, { reps: 8, weight: 50 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 102.5 }, { reps: 5, weight: 105 }] },
    ],
  },
  {
    name: 'Push Day', date: '2025-11-29',
    startedAt: d('2025-11-29', 10), completedAt: d('2025-11-29', 11),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 67.5 }, { reps: 8, weight: 70 }, { reps: 6, weight: 70 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 40 }, { reps: 9, weight: 40 }, { reps: 8, weight: 42.5 }] },
    ],
  },

  // ── December 2025 ─────────────────────────────────────────────────────────
  {
    name: 'Leg Day', date: '2025-12-02',
    startedAt: d('2025-12-02', 10), completedAt: d('2025-12-02', 11, 15),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 85 }, { reps: 5, weight: 87.5 }, { reps: 5, weight: 87.5 }, { reps: 5, weight: 87.5 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 105 }, { reps: 5, weight: 107.5 }, { reps: 3, weight: 110 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2025-12-04',
    startedAt: d('2025-12-04', 18), completedAt: d('2025-12-04', 19, 10),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 6, weight: 0 }, { reps: 5, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }, { reps: 8, weight: 52.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2025-12-06',
    startedAt: d('2025-12-06', 7), completedAt: d('2025-12-06', 8),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 70 }, { reps: 6, weight: 72.5 }, { reps: 6, weight: 72.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 40 }, { reps: 10, weight: 42.5 }, { reps: 8, weight: 42.5 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2025-12-13',
    startedAt: d('2025-12-13', 10), completedAt: d('2025-12-13', 11, 15),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 87.5 }, { reps: 5, weight: 90 }, { reps: 5, weight: 90 }, { reps: 5, weight: 90 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 107.5 }, { reps: 5, weight: 110 }, { reps: 3, weight: 115 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2025-12-16',
    startedAt: d('2025-12-16', 18), completedAt: d('2025-12-16', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 6, weight: 0 }, { reps: 6, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 52.5 }, { reps: 10, weight: 52.5 }, { reps: 8, weight: 55 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 110 }, { reps: 5, weight: 112.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2025-12-18',
    startedAt: d('2025-12-18', 7), completedAt: d('2025-12-18', 8, 5),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 72.5 }, { reps: 6, weight: 75 }, { reps: 6, weight: 75 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 9, weight: 42.5 }, { reps: 8, weight: 45 }] },
    ],
  },
  {
    name: 'Full Body', date: '2025-12-23',
    startedAt: d('2025-12-23', 9), completedAt: d('2025-12-23', 10, 30),
    exercises: [
      { exerciseId: squat.id,      sets: [{ reps: 5, weight: 90 }, { reps: 5, weight: 92.5 }, { reps: 5, weight: 92.5 }] },
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 75 }, { reps: 6, weight: 75 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 52.5 }, { reps: 10, weight: 55 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2025-12-27',
    startedAt: d('2025-12-27', 18), completedAt: d('2025-12-27', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 7, weight: 0 }, { reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 55 }, { reps: 10, weight: 55 }, { reps: 8, weight: 57.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2025-12-29',
    startedAt: d('2025-12-29', 7), completedAt: d('2025-12-29', 7, 55),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 75 }, { reps: 6, weight: 77.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 10, weight: 45 }, { reps: 8, weight: 45 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2025-12-31',
    startedAt: d('2025-12-31', 10), completedAt: d('2025-12-31', 11, 10),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 92.5 }, { reps: 5, weight: 92.5 }, { reps: 5, weight: 95 }, { reps: 5, weight: 95 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 112.5 }, { reps: 5, weight: 115 }, { reps: 3, weight: 120 }] },
    ],
  },

  // ── January 2026 ──────────────────────────────────────────────────────────
  {
    name: 'Pull Day', date: '2026-01-06',
    startedAt: d('2026-01-06', 18), completedAt: d('2026-01-06', 19),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 7, weight: 0 }, { reps: 6, weight: 0 }, { reps: 6, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 52.5 }, { reps: 8, weight: 52.5 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 112.5 }, { reps: 5, weight: 115 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-01-08',
    startedAt: d('2026-01-08', 7), completedAt: d('2026-01-08', 7, 55),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 72.5 }, { reps: 6, weight: 72.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 10, weight: 42.5 }, { reps: 8, weight: 45 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2026-01-10',
    startedAt: d('2026-01-10', 10), completedAt: d('2026-01-10', 11, 15),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 90 }, { reps: 5, weight: 92.5 }, { reps: 5, weight: 95 }, { reps: 5, weight: 95 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 110 }, { reps: 5, weight: 112.5 }, { reps: 3, weight: 117.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-01-13',
    startedAt: d('2026-01-13', 7), completedAt: d('2026-01-13', 7, 58),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 72.5 }, { reps: 6, weight: 75 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 10, weight: 45 }, { reps: 8, weight: 45 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2026-01-15',
    startedAt: d('2026-01-15', 18), completedAt: d('2026-01-15', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 6, weight: 0 }, { reps: 6, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 52.5 }, { reps: 8, weight: 55 }] },
    ],
  },
  {
    name: 'Full Body', date: '2026-01-17',
    startedAt: d('2026-01-17', 9), completedAt: d('2026-01-17', 10, 15),
    exercises: [
      { exerciseId: squat.id,      sets: [{ reps: 5, weight: 90 }, { reps: 5, weight: 92.5 }, { reps: 5, weight: 95 }] },
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 72.5 }, { reps: 6, weight: 75 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 52.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-01-20',
    startedAt: d('2026-01-20', 7), completedAt: d('2026-01-20', 7, 57),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 72.5 }, { reps: 6, weight: 75 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 10, weight: 45 }, { reps: 8, weight: 47.5 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2026-01-22',
    startedAt: d('2026-01-22', 18), completedAt: d('2026-01-22', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 6, weight: 0 }, { reps: 5, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 52.5 }, { reps: 10, weight: 55 }, { reps: 8, weight: 57.5 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 112.5 }, { reps: 5, weight: 115 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2026-01-24',
    startedAt: d('2026-01-24', 10), completedAt: d('2026-01-24', 11, 10),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 6, weight: 92.5 }, { reps: 6, weight: 95 }, { reps: 5, weight: 97.5 }, { reps: 5, weight: 97.5 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 115 }, { reps: 5, weight: 117.5 }, { reps: 3, weight: 122.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-01-27',
    startedAt: d('2026-01-27', 7), completedAt: d('2026-01-27', 7, 50),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 72.5 }, { reps: 8, weight: 75 }, { reps: 6, weight: 77.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 42.5 }, { reps: 10, weight: 45 }, { reps: 8, weight: 47.5 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2026-01-29',
    startedAt: d('2026-01-29', 18), completedAt: d('2026-01-29', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 7, weight: 0 }, { reps: 6, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 55 }, { reps: 10, weight: 57.5 }, { reps: 8, weight: 60 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2026-01-30',
    startedAt: d('2026-01-30', 10), completedAt: d('2026-01-30', 11, 10),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 6, weight: 95 }, { reps: 6, weight: 97.5 }, { reps: 5, weight: 100 }, { reps: 5, weight: 102.5 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 115 }, { reps: 5, weight: 117.5 }, { reps: 3, weight: 125 }] },
    ],
  },

  // ── February 2026 ─────────────────────────────────────────────────────────
  {
    name: 'Pull Day', date: '2026-02-03',
    startedAt: d('2026-02-03', 18), completedAt: d('2026-02-03', 19),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 6, weight: 0 }, { reps: 6, weight: 0 }, { reps: 5, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 55 }, { reps: 10, weight: 57.5 }, { reps: 8, weight: 60 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-02-05',
    startedAt: d('2026-02-05', 7), completedAt: d('2026-02-05', 7, 55),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 75 }, { reps: 8, weight: 75 }, { reps: 7, weight: 77.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 45 }, { reps: 10, weight: 47.5 }, { reps: 8, weight: 50 }] },
    ],
  },
  {
    name: 'Full Body', date: '2026-02-07',
    startedAt: d('2026-02-07', 9), completedAt: d('2026-02-07', 10, 20),
    exercises: [
      { exerciseId: squat.id,      sets: [{ reps: 5, weight: 100 }, { reps: 5, weight: 102.5 }, { reps: 5, weight: 105 }] },
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 75 }, { reps: 8, weight: 77.5 }, { reps: 6, weight: 80 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 120 }, { reps: 5, weight: 122.5 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2026-02-10',
    startedAt: d('2026-02-10', 18), completedAt: d('2026-02-10', 19, 5),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 7, weight: 0 }, { reps: 7, weight: 0 }, { reps: 6, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 57.5 }, { reps: 10, weight: 60 }, { reps: 8, weight: 62.5 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-02-12',
    startedAt: d('2026-02-12', 7), completedAt: d('2026-02-12', 7, 58),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 77.5 }, { reps: 8, weight: 80 }, { reps: 6, weight: 82.5 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 47.5 }, { reps: 9, weight: 50 }, { reps: 8, weight: 50 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2026-02-14',
    startedAt: d('2026-02-14', 10), completedAt: d('2026-02-14', 11, 15),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 6, weight: 100 }, { reps: 6, weight: 100 }, { reps: 5, weight: 110 }, { reps: 5, weight: 110 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 125 }, { reps: 5, weight: 125 }, { reps: 3, weight: 135 }] },
    ],
  },
  {
    name: 'Pull Day', date: '2026-02-17',
    startedAt: d('2026-02-17', 18), completedAt: d('2026-02-17', 19, 10),
    exercises: [
      { exerciseId: pullUp.id,     sets: [{ reps: 8, weight: 0 }, { reps: 7, weight: 0 }, { reps: 6, weight: 0 }] },
      { exerciseId: barbellRow.id, sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }, { reps: 8, weight: 65 }] },
      { exerciseId: deadlift.id,   sets: [{ reps: 5, weight: 120 }, { reps: 5, weight: 120 }, { reps: 3, weight: 130 }] },
    ],
  },
  {
    name: 'Push Day', date: '2026-02-19',
    startedAt: d('2026-02-19', 7), completedAt: d('2026-02-19', 8, 5),
    exercises: [
      { exerciseId: benchPress.id, sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 6, weight: 85 }, { reps: 6, weight: 85 }] },
      { exerciseId: ohp.id,        sets: [{ reps: 10, weight: 50 }, { reps: 8, weight: 55 }, { reps: 8, weight: 55 }] },
    ],
  },
  {
    name: 'Leg Day', date: '2026-02-21',
    startedAt: d('2026-02-21', 10), completedAt: d('2026-02-21', 11, 20),
    exercises: [
      { exerciseId: squat.id,    sets: [{ reps: 5, weight: 105 }, { reps: 5, weight: 107.5 }, { reps: 5, weight: 110 }, { reps: 3, weight: 115 }] },
      { exerciseId: deadlift.id, sets: [{ reps: 5, weight: 127.5 }, { reps: 5, weight: 130 }, { reps: 3, weight: 137.5 }] },
    ],
  },
]

for (const wd of workoutDefs) {
  const [workout] = await db
    .insert(schema.workouts)
    .values({ userId: USER_ID, name: wd.name, date: wd.date, startedAt: wd.startedAt, completedAt: wd.completedAt })
    .returning()

  for (let i = 0; i < wd.exercises.length; i++) {
    const exDef = wd.exercises[i]
    const [we] = await db
      .insert(schema.workoutExercises)
      .values({ workoutId: workout.id, exerciseId: exDef.exerciseId, orderIndex: i })
      .returning()

    await db.insert(schema.sets).values(
      exDef.sets.map((s, idx) => ({
        workoutExerciseId: we.id,
        setNumber: idx + 1,
        reps: s.reps,
        weight: String(s.weight),
      }))
    )
  }
}

console.log(`Seeded 6 exercises and ${workoutDefs.length} workouts for user ${USER_ID}`)
