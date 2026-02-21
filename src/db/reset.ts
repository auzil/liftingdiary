import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

await sql`DROP TABLE IF EXISTS sets CASCADE`;
await sql`DROP TABLE IF EXISTS workout_exercises CASCADE`;
await sql`DROP TABLE IF EXISTS workouts CASCADE`;
await sql`DROP TABLE IF EXISTS exercises CASCADE`;
await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;

console.log('All tables dropped.');
