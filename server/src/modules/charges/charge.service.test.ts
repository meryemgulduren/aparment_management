import { describe, expect, it } from "vitest";
import { ConflictError, NotFoundError } from "../../shared/errors.js";
import type { Charge, ChargeRepository, NewCharge } from "./charge.repository.js";
import { ChargeService } from "./charge.service.js";

// Veritabanındaki "bir daireye ayda bir aidat" kuralını taklit eden sahte repository.
class InMemoryChargeRepository implements ChargeRepository {
  rows: Charge[] = [];

  private isDuplicate(data: NewCharge) {
    return (
      data.kind === "dues" &&
      this.rows.some(
        (r) => r.kind === "dues" && r.apartmentId === data.apartmentId && r.period === data.period,
      )
    );
  }
  async create(data: NewCharge) {
    if (this.isDuplicate(data)) return null;
    const row: Charge = { ...data, id: this.rows.length + 1, createdAt: new Date() };
    this.rows.push(row);
    return row;
  }
  async createMany(rows: NewCharge[]) {
    let created = 0;
    for (const row of rows) if (await this.create(row)) created++;
    return created;
  }
  async listAll() { return this.rows; }
  async listByApartment(id: number) { return this.rows.filter((r) => r.apartmentId === id); }
  async findLastDuesAmount() { return null; }
  async delete() { return false; }
}

function setup(apartmentIds: number[]) {
  const charges = new InMemoryChargeRepository();
  const apartments = {
    listIds: async () => apartmentIds,
    findById: async (id: number) =>
      apartmentIds.includes(id)
        ? { id, label: String(id), floor: null, householdSize: 0, note: null, createdAt: new Date() }
        : null,
  };
  return { charges, service: new ChargeService(charges, apartments) };
}

const october = {
  kind: "dues" as const,
  period: "2026-10",
  amountKurus: 100_000,
  dueDate: "2026-10-10",
  description: null,
};

describe("ChargeService.createForAllApartments", () => {
  it("tüm dairelere aidat yazar", async () => {
    const { charges, service } = setup([1, 2, 3]);
    expect(await service.createForAllApartments(october)).toEqual({ created: 3, skipped: 0 });
    expect(charges.rows.map((r) => r.apartmentId)).toEqual([1, 2, 3]);
  });

  it("aynı ay ikinci kez çalışınca çift kayıt yazmaz", async () => {
    const { charges, service } = setup([1, 2, 3]);
    await service.createForAllApartments(october);
    expect(await service.createForAllApartments(october)).toEqual({ created: 0, skipped: 3 });
    expect(charges.rows).toHaveLength(3);
  });

  it("ek ödeme aynı ay tekrar yazılabilir", async () => {
    const { service } = setup([1, 2]);
    const extra = { ...october, kind: "extra" as const, description: "Asansör" };
    await service.createForAllApartments(extra);
    expect(await service.createForAllApartments(extra)).toEqual({ created: 2, skipped: 0 });
  });

  it("daire yoksa hata verir", async () => {
    const { service } = setup([]);
    await expect(service.createForAllApartments(october)).rejects.toThrow(ConflictError);
  });
});

describe("ChargeService.create", () => {
  it("aynı aya ikinci aidatı reddeder", async () => {
    const { service } = setup([1]);
    await service.create({ ...october, apartmentId: 1 });
    await expect(service.create({ ...october, apartmentId: 1 })).rejects.toThrow(ConflictError);
  });

  it("olmayan daireye borç yazmaz", async () => {
    const { service } = setup([1]);
    await expect(service.create({ ...october, apartmentId: 99 })).rejects.toThrow(NotFoundError);
  });
});
