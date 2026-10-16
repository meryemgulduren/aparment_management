import { asc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { apartments, charges, payments, residents } from "../../db/schema.js";

export type Apartment = typeof apartments.$inferSelect;

export interface ApartmentWithBalance extends Apartment {
  /** Borçlar − ödemeler. Pozitifse borçlu, negatifse fazla (avans) ödemiş. */
  balanceKurus: number;
}

export interface NewApartment {
  label: string;
  floor: number | null;
  householdSize: number;
  note: string | null;
}

export type ApartmentChanges = Partial<NewApartment>;

export interface ApartmentRepository {
  listWithBalances(): Promise<ApartmentWithBalance[]>;
  listIds(): Promise<number[]>;
  findById(id: number): Promise<Apartment | null>;
  findByLabel(label: string): Promise<Apartment | null>;
  create(data: NewApartment): Promise<Apartment>;
  update(id: number, changes: ApartmentChanges): Promise<Apartment | null>;
  delete(id: number): Promise<boolean>;
  hasLinkedRecords(id: number): Promise<boolean>;
}

export class DrizzleApartmentRepository implements ApartmentRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listWithBalances(): Promise<ApartmentWithBalance[]> {
    // Bakiye saklanmaz; her seferinde borç ve ödeme toplamlarından hesaplanır.
    const chargeTotal = sql`(select coalesce(sum(${charges.amountKurus}), 0) from ${charges} where ${charges.apartmentId} = ${apartments.id})`;
    const paymentTotal = sql`(select coalesce(sum(${payments.amountKurus}), 0) from ${payments} where ${payments.apartmentId} = ${apartments.id})`;

    const rows = await this.db
      .select({
        apartment: apartments,
        balanceKurus: sql<number>`${chargeTotal} - ${paymentTotal}`.mapWith(Number),
      })
      .from(apartments);
    return rows.map((row) => ({ ...row.apartment, balanceKurus: row.balanceKurus }));
  }

  async listIds(): Promise<number[]> {
    const rows = await this.db.select({ id: apartments.id }).from(apartments).orderBy(asc(apartments.id));
    return rows.map((row) => row.id);
  }

  async findById(id: number): Promise<Apartment | null> {
    const [row] = await this.db.select().from(apartments).where(eq(apartments.id, id));
    return row ?? null;
  }

  async findByLabel(label: string): Promise<Apartment | null> {
    const [row] = await this.db.select().from(apartments).where(eq(apartments.label, label));
    return row ?? null;
  }

  async create(data: NewApartment): Promise<Apartment> {
    const [row] = await this.db.insert(apartments).values(data).returning();
    return row;
  }

  async update(id: number, changes: ApartmentChanges): Promise<Apartment | null> {
    const [row] = await this.db
      .update(apartments)
      .set(changes)
      .where(eq(apartments.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(apartments)
      .where(eq(apartments.id, id))
      .returning({ id: apartments.id });
    return rows.length > 0;
  }

  async hasLinkedRecords(id: number): Promise<boolean> {
    const result = await this.db.execute<{ linked: boolean }>(sql`
      select exists (select 1 from ${residents} where ${residents.apartmentId} = ${id})
          or exists (select 1 from ${charges} where ${charges.apartmentId} = ${id})
          or exists (select 1 from ${payments} where ${payments.apartmentId} = ${id})
        as linked
    `);
    return Boolean(result.rows[0]?.linked);
  }
}
