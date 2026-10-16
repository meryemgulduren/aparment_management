import { and, desc, eq, gte, lt, sql, type SQL } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { expenses } from "../../db/schema.js";
import { periodRange } from "../../shared/dates.js";

export type Expense = typeof expenses.$inferSelect;
export type ExpenseCategory = Expense["category"];

export interface NewExpense {
  category: ExpenseCategory;
  amountKurus: number;
  spentAt: string;
  description: string | null;
}

export interface ExpenseRepository {
  create(data: NewExpense): Promise<Expense>;
  delete(id: number): Promise<boolean>;
  list(period: string | undefined, limit: number): Promise<Expense[]>;
  /** Tüm giderlerin toplamı; period verilirse yalnızca o ayın. */
  sum(period?: string): Promise<number>;
}

function periodCondition(period: string): SQL | undefined {
  const { start, end } = periodRange(period);
  return and(gte(expenses.spentAt, start), lt(expenses.spentAt, end));
}

export class DrizzleExpenseRepository implements ExpenseRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(data: NewExpense): Promise<Expense> {
    const [row] = await this.db.insert(expenses).values(data).returning();
    return row;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });
    return rows.length > 0;
  }

  list(period: string | undefined, limit: number): Promise<Expense[]> {
    return this.db
      .select()
      .from(expenses)
      .where(period ? periodCondition(period) : undefined)
      .orderBy(desc(expenses.spentAt), desc(expenses.id))
      .limit(limit);
  }

  async sum(period?: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${expenses.amountKurus}), 0)`.mapWith(Number) })
      .from(expenses)
      .where(period ? periodCondition(period) : undefined);
    return row.total;
  }
}
