import { and, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { incomes } from "../../db/schema.js";
import { periodRange } from "../../shared/dates.js";

export type Income = typeof incomes.$inferSelect;
export type IncomeKind = Income["kind"];

export interface NewIncome {
  kind: IncomeKind;
  amountKurus: number;
  receivedAt: string;
  description: string | null;
}

export interface IncomeRepository {
  /** Kasa devri zaten varsa kayıt yapmaz ve null döner. */
  create(data: NewIncome): Promise<Income | null>;
  delete(id: number): Promise<boolean>;
  list(limit: number): Promise<Income[]>;
  /** Tüm gelirlerin toplamı; period verilirse yalnızca o ayın. */
  sum(period?: string): Promise<number>;
}

function periodCondition(period: string): SQL | undefined {
  const { start, end } = periodRange(period);
  return and(gte(incomes.receivedAt, start), lt(incomes.receivedAt, end));
}

export class DrizzleIncomeRepository implements IncomeRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(data: NewIncome): Promise<Income | null> {
    // "Tek kasa devri" kuralı veritabanı indeksinde (incomes_single_opening_balance).
    const [row] = await this.db.insert(incomes).values(data).onConflictDoNothing().returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(incomes)
      .where(eq(incomes.id, id))
      .returning({ id: incomes.id });
    return rows.length > 0;
  }

  list(limit: number): Promise<Income[]> {
    return this.db
      .select()
      .from(incomes)
      .orderBy(desc(incomes.receivedAt), desc(incomes.id))
      .limit(limit);
  }

  async sum(period?: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${incomes.amountKurus}), 0)`.mapWith(Number) })
      .from(incomes)
      .where(period ? periodCondition(period) : undefined);
    return row.total;
  }
}
