CREATE TYPE "public"."income_kind" AS ENUM('opening_balance', 'other');--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "incomes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"kind" "income_kind" NOT NULL,
	"amount_kurus" integer NOT NULL,
	"received_at" date NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incomes_amount_positive" CHECK ("incomes"."amount_kurus" > 0)
);
--> statement-breakpoint
CREATE INDEX "incomes_received_at_idx" ON "incomes" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "incomes_single_opening_balance" ON "incomes" USING btree ("kind") WHERE kind = 'opening_balance';