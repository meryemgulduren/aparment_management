import { asc, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { charges } from "../../db/schema.js";

export type Charge = typeof charges.$inferSelect;
export type ChargeKind = Charge["kind"];

export interface NewCharge {
  apartmentId: number;
  kind: ChargeKind;
  period: string;
  amountKurus: number;
  dueDate: string;
  description: string | null;
}

export interface ChargeRepository {
  /** Aynı ay için aidat zaten varsa kayıt yapmaz ve null döner. */
  create(data: NewCharge): Promise<Charge | null>;
  /** Hepsini tek seferde yazar; zaten aidatı olan daireleri atlar. Yazılan kayıt sayısını döner. */
  createMany(rows: NewCharge[]): Promise<number>;
  listAll(): Promise<Charge[]>;
  listByApartment(apartmentId: number): Promise<Charge[]>;
  findLastDuesAmount(): Promise<number | null>;
  delete(id: number): Promise<boolean>;
}

export class DrizzleChargeRepository implements ChargeRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(data: NewCharge): Promise<Charge | null> {
    // Çakışma kontrolü veritabanının benzersiz indeksine (charges_dues_once_per_period)
    // bırakılır. Önce "var mı" diye bakıp sonra yazmak, iki eşzamanlı istekte çift
    // kayda yol açabilirdi.
    const [row] = await this.db.insert(charges).values(data).onConflictDoNothing().returning();
    return row ?? null;
  }

  async createMany(rows: NewCharge[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    // Tek INSERT tek işlemdir: ya hepsi yazılır ya hiçbiri.
    const inserted = await this.db
      .insert(charges)
      .values(rows)
      .onConflictDoNothing()
      .returning({ id: charges.id });
    return inserted.length;
  }

  listAll(): Promise<Charge[]> {
    return this.db.select().from(charges).orderBy(asc(charges.dueDate), asc(charges.id));
  }

  listByApartment(apartmentId: number): Promise<Charge[]> {
    return this.db
      .select()
      .from(charges)
      .where(eq(charges.apartmentId, apartmentId))
      .orderBy(asc(charges.dueDate), asc(charges.id));
  }

  async findLastDuesAmount(): Promise<number | null> {
    const [row] = await this.db
      .select({ amountKurus: charges.amountKurus })
      .from(charges)
      .where(eq(charges.kind, "dues"))
      .orderBy(desc(charges.period), desc(charges.id))
      .limit(1);
    return row?.amountKurus ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(charges)
      .where(eq(charges.id, id))
      .returning({ id: charges.id });
    return rows.length > 0;
  }
}
