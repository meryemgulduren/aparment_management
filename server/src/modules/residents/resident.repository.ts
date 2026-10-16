import { asc, desc, eq } from "drizzle-orm";
import type { Database } from "../../db/index.js";
import { residents } from "../../db/schema.js";

export type Resident = typeof residents.$inferSelect;
export type ResidentKind = Resident["kind"];

export interface NewResident {
  apartmentId: number;
  fullName: string;
  phone: string | null;
  kind: ResidentKind;
  note: string | null;
}

export type ResidentChanges = Partial<Omit<NewResident, "apartmentId">> & {
  isActive?: boolean;
};

export interface ResidentRepository {
  listByApartment(apartmentId: number): Promise<Resident[]>;
  listActive(): Promise<Resident[]>;
  findById(id: number): Promise<Resident | null>;
  create(data: NewResident): Promise<Resident>;
  update(id: number, changes: ResidentChanges): Promise<Resident | null>;
  delete(id: number): Promise<boolean>;
}

export class DrizzleResidentRepository implements ResidentRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  listByApartment(apartmentId: number): Promise<Resident[]> {
    // Önce oturanlar, sonra taşınmış olanlar.
    return this.db
      .select()
      .from(residents)
      .where(eq(residents.apartmentId, apartmentId))
      .orderBy(desc(residents.isActive), asc(residents.kind), asc(residents.fullName));
  }

  listActive(): Promise<Resident[]> {
    return this.db
      .select()
      .from(residents)
      .where(eq(residents.isActive, true))
      .orderBy(asc(residents.kind), asc(residents.fullName));
  }

  async findById(id: number): Promise<Resident | null> {
    const [row] = await this.db.select().from(residents).where(eq(residents.id, id));
    return row ?? null;
  }

  async create(data: NewResident): Promise<Resident> {
    const [row] = await this.db.insert(residents).values(data).returning();
    return row;
  }

  async update(id: number, changes: ResidentChanges): Promise<Resident | null> {
    const [row] = await this.db
      .update(residents)
      .set(changes)
      .where(eq(residents.id, id))
      .returning();
    return row ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.db
      .delete(residents)
      .where(eq(residents.id, id))
      .returning({ id: residents.id });
    return rows.length > 0;
  }
}
