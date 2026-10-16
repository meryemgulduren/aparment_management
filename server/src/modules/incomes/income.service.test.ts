import { describe, expect, it } from "vitest";
import { ConflictError, ValidationError } from "../../shared/errors.js";
import type { Income, IncomeRepository, NewIncome } from "./income.repository.js";
import { IncomeService } from "./income.service.js";

// Veritabanındaki "tek kasa devri" kuralını taklit eden sahte repository.
class InMemoryIncomeRepository implements IncomeRepository {
  rows: Income[] = [];

  async create(data: NewIncome) {
    if (data.kind === "opening_balance" && this.rows.some((r) => r.kind === "opening_balance")) {
      return null;
    }
    const row: Income = { ...data, id: this.rows.length + 1, createdAt: new Date() };
    this.rows.push(row);
    return row;
  }
  async delete(id: number) {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.id !== id);
    return this.rows.length < before;
  }
  async list() { return this.rows; }
  async sum() { return this.rows.reduce((t, r) => t + r.amountKurus, 0); }
}

const opening: NewIncome = {
  kind: "opening_balance",
  amountKurus: 2_500_000,
  receivedAt: "2026-10-01",
  description: null,
};

function setup() {
  const repo = new InMemoryIncomeRepository();
  return { repo, service: new IncomeService(repo, () => "2026-10-16") };
}

describe("IncomeService", () => {
  it("kasa devri bir kez girilir", async () => {
    const { service } = setup();
    await service.create(opening);
    await expect(service.create(opening)).rejects.toThrow(ConflictError);
  });

  it("kasa devri silinince yeniden girilebilir", async () => {
    const { service } = setup();
    const first = await service.create(opening);
    await service.delete(first.id);
    await expect(service.create({ ...opening, amountKurus: 100 })).resolves.toMatchObject({ amountKurus: 100 });
  });

  it("diğer gelir birden çok kez girilebilir", async () => {
    const { repo, service } = setup();
    const other: NewIncome = { ...opening, kind: "other", description: "Bağış" };
    await service.create(other);
    await service.create(other);
    expect(repo.rows).toHaveLength(2);
  });

  it("ileri tarihi reddeder", async () => {
    const { service } = setup();
    await expect(service.create({ ...opening, receivedAt: "2026-10-17" })).rejects.toThrow(ValidationError);
  });
});
