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
export const expenseCategory = pgEnum("expense_category", [
  "electricity",
  "water",
  "natural_gas",
  "cleaning",
  "elevator",
  "maintenance",
  "management",
  "other",
]);

// Kasaya tahsilat dışında giren para.
// opening_balance: sisteme geçmeden önce kasada olan para (kasa devri).
export const incomeKind = pgEnum("income_kind", ["opening_balance", "other"]);

export const apartments = pgTable(
  "apartments",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    // Kapı numarası. "5", "3A" gibi değerler olabildiği için metin.
    label: text().notNull().unique(),
    floor: integer(),
    // Dairede oturan toplam kişi sayısı (çocuklar dahil). Sakin kayıtlarından
    // ayrı tutulur; her aile bireyini tek tek kaydetmek gerekmesin.
    householdSize: integer().notNull().default(0),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("apartments_household_size_nonnegative", sql`${t.householdSize} >= 0`),
  ],
);

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
    note: text(),
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

export const expenses = pgTable(
  "expenses",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    category: expenseCategory().notNull(),
    amountKurus: integer().notNull(),
    spentAt: date().notNull(),
    description: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("expenses_spent_at_idx").on(t.spentAt),
    check("expenses_amount_positive", sql`${t.amountKurus} > 0`),
  ],
);

export const incomes = pgTable(
  "incomes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    kind: incomeKind().notNull(),
    amountKurus: integer().notNull(),
    receivedAt: date().notNull(),
    description: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("incomes_received_at_idx").on(t.receivedAt),
    check("incomes_amount_positive", sql`${t.amountKurus} > 0`),
    // Kasa devri yalnızca bir kez girilir; düzeltmek için silinip yeniden girilir.
    uniqueIndex("incomes_single_opening_balance")
      .on(t.kind)
      .where(sql`kind = 'opening_balance'`),
  ],
);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text().notNull().unique(),
  // scrypt çıktısı; düz şifre hiçbir yerde saklanmaz.
  passwordHash: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    // Çerezdeki belirtecin SHA-256 özeti. Veritabanı sızsa bile bu değerle
    // oturum açılamaz.
    tokenHash: text().primaryKey(),
    userId: integer()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
