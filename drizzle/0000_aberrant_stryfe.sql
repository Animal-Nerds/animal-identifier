CREATE TABLE "sightings" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal" text NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
