CREATE TYPE "public"."charge_kind" AS ENUM('dues', 'extra');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."resident_kind" AS ENUM('owner', 'tenant');--> statement-breakpoint
CREATE TABLE "apartments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "apartments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"floor" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apartments_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "charges_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"apartment_id" integer NOT NULL,
	"kind" charge_kind NOT NULL,
	"period" text NOT NULL,
	"amount_kurus" integer NOT NULL,
	"due_date" date NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charges_amount_positive" CHECK ("charges"."amount_kurus" > 0),
	CONSTRAINT "charges_period_format" CHECK ("charges"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"apartment_id" integer NOT NULL,
	"amount_kurus" integer NOT NULL,
	"paid_at" date NOT NULL,
	"method" "payment_method" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount_kurus" > 0)
);
--> statement-breakpoint
CREATE TABLE "residents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "residents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"apartment_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"kind" "resident_kind" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "residents" ADD CONSTRAINT "residents_apartment_id_apartments_id_fk" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "charges_apartment_idx" ON "charges" USING btree ("apartment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "charges_dues_once_per_period" ON "charges" USING btree ("apartment_id","period") WHERE kind = 'dues';--> statement-breakpoint
CREATE INDEX "payments_apartment_idx" ON "payments" USING btree ("apartment_id");--> statement-breakpoint
CREATE INDEX "residents_apartment_idx" ON "residents" USING btree ("apartment_id");