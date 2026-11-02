CREATE TABLE "login_attempts" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"failures" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
