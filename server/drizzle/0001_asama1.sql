CREATE TYPE "public"."expense_category" AS ENUM('electricity', 'water', 'natural_gas', 'cleaning', 'elevator', 'maintenance', 'management', 'other');--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expenses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category" "expense_category" NOT NULL,
	"amount_kurus" integer NOT NULL,
	"spent_at" date NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_positive" CHECK ("expenses"."amount_kurus" > 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "apartments" ADD COLUMN "household_size" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "apartments" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "residents" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_spent_at_idx" ON "expenses" USING btree ("spent_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "apartments" ADD CONSTRAINT "apartments_household_size_nonnegative" CHECK ("apartments"."household_size" >= 0);