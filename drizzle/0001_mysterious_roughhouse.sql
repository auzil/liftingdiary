CREATE TABLE "custom_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_exercises_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "workout_exercises" ALTER COLUMN "exercise_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD COLUMN "custom_exercise_id" integer;--> statement-breakpoint
CREATE INDEX "custom_exercises_user_id_idx" ON "custom_exercises" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_custom_exercise_id_custom_exercises_id_fk" FOREIGN KEY ("custom_exercise_id") REFERENCES "public"."custom_exercises"("id") ON DELETE cascade ON UPDATE no action;