import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const residentKind = pgEnum("resident_kind", ["owner", "tenant"]);
export const chargeKind = pgEnum("charge_kind", ["dues", "extra"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "transfer"]);

export const apartments = pgTable("apartments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // Kapı numarası. "5", "3A" gibi değerler olabildiği için metin.
  label: text().notNull().unique(),
  floor: integer(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const residents = pgTable(
  "residents",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apartmentId: integer()
      .notNull()
      .references(() => apartments.id, { onDelete: "restrict" }),
    fullName: text().notNull(),
    phone: text(),
    kind: residentKind().notNull(),
    // Taşınan sakin silinmez, pasife alınır; geçmiş kayıtlar anlamını korur.
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("residents_apartment_idx").on(t.apartmentId)],
);

export const charges = pgTable(
  "charges",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apartmentId: integer()
      .notNull()
      .references(() => apartments.id, { onDelete: "restrict" }),
    kind: chargeKind().notNull(),
    // Borcun ait olduğu ay, "2026-10" biçiminde.
    period: text().notNull(),
    amountKurus: integer().notNull(),
    dueDate: date().notNull(),
    description: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("charges_apartment_idx").on(t.apartmentId),
    // Bir daireye aynı ay için yalnızca bir aidat borcu yazılabilir.
    uniqueIndex("charges_dues_once_per_period")
      .on(t.apartmentId, t.period)
      .where(sql`kind = 'dues'`),
    check("charges_amount_positive", sql`${t.amountKurus} > 0`),
    check(
      "charges_period_format",
      sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    apartmentId: integer()
      .notNull()
      .references(() => apartments.id, { onDelete: "restrict" }),
    amountKurus: integer().notNull(),
    paidAt: date().notNull(),
    method: paymentMethod().notNull(),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_apartment_idx").on(t.apartmentId),
    check("payments_amount_positive", sql`${t.amountKurus} > 0`),
  ],
);
