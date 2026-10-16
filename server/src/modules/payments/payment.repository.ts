import { and, desc, eq, getTableColumns, gte, lt, sql, type SQL } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { apartments, payments } from "../../db/schema.js";
import { periodRange } from "../../shared/dates.js";

export type Payment = typeof payments.$inferSelect;
export type PaymentMethod = Payment["method"];

export interface NewPayment {
  apartmentId: number;
  amountKurus: number;
  paidAt: string;
  method: PaymentMethod;
  note: string | null;
}

export interface PaymentListItem extends Payment {
  apartmentLabel: string;
}

export interface PaymentFilter {
  period?: string;
  apartmentId?: number;
}

export interface PaymentRepository {
  create(data: NewPayment): Promise<Payment>;
  delete(id: number): Promise<boolean>;
  list(filter: PaymentFilter, limit: number): Promise<PaymentListItem[]>;
  listByApartment(apartmentId: number): Promise<Payment[]>;
  /** Daire başına toplam ödeme. */
  totalsByApartment(): Promise<Map<number, number>>;
  /** Tüm ödemelerin toplamı; period verilirse yalnızca o ayın. */
  sum(period?: string): Promise<number>;
}

function periodCondition(period: string): SQL | undefined {
  const { start, end } = periodRange(period);
  return and(gte(payments.paidAt, start), lt(payments.paidAt, end));
}

export class DrizzlePaymentRepository implements PaymentRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(data: NewPayment): Promise<Payment> {
    const [row] = await this.db.insert(payments).values(data).returning();
    return row;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning({ id: payments.id });
    return rows.length > 0;
  }

  list(filter: PaymentFilter, limit: number): Promise<PaymentListItem[]> {
    return this.db
      .select({ ...getTableColumns(payments), apartmentLabel: apartments.label })
      .from(payments)
      .innerJoin(apartments, eq(apartments.id, payments.apartmentId))
      .where(
        and(
          filter.period ? periodCondition(filter.period) : undefined,
          filter.apartmentId ? eq(payments.apartmentId, filter.apartmentId) : undefined,
        ),
      )
      .orderBy(desc(payments.paidAt), desc(payments.id))
      .limit(limit);
  }

  listByApartment(apartmentId: number): Promise<Payment[]> {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.apartmentId, apartmentId))
      .orderBy(desc(payments.paidAt), desc(payments.id));
  }

  async totalsByApartment(): Promise<Map<number, number>> {
    const rows = await this.db
      .select({
        apartmentId: payments.apartmentId,
        total: sql<number>`sum(${payments.amountKurus})`.mapWith(Number),
      })
      .from(payments)
      .groupBy(payments.apartmentId);
    return new Map(rows.map((row) => [row.apartmentId, row.total]));
  }

  async sum(period?: string): Promise<number> {
    const [row] = await this.db
      .select({ total: sql<number>`coalesce(sum(${payments.amountKurus}), 0)`.mapWith(Number) })
      .from(payments)
      .where(period ? periodCondition(period) : undefined);
    return row.total;
  }
}
