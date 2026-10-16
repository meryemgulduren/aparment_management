import { describe, expect, it } from "vitest";
import { allocatePayments, sumKurus } from "./ledger.js";

const charges = [
  { id: 2, dueDate: "2026-09-10", amountKurus: 50_000 },
  { id: 1, dueDate: "2026-08-10", amountKurus: 50_000 },
  { id: 3, dueDate: "2026-10-10", amountKurus: 50_000 },
];

function statuses(totalPaid: number) {
  return allocatePayments(charges, totalPaid).map((c) => [c.id, c.status, c.paidKurus]);
}

describe("allocatePayments", () => {
  it("ödeme yoksa hepsi ödenmedi", () => {
    expect(statuses(0)).toEqual([
      [1, "unpaid", 0],
      [2, "unpaid", 0],
      [3, "unpaid", 0],
    ]);
  });

  it("ödemeyi en eski borçtan başlayarak dağıtır", () => {
    expect(statuses(75_000)).toEqual([
      [1, "paid", 50_000],
      [2, "partial", 25_000],
      [3, "unpaid", 0],
    ]);
  });

  it("fazla ödemede tüm borçlar ödendi olur", () => {
    expect(statuses(200_000).every(([, status]) => status === "paid")).toBe(true);
  });

  it("aynı tarihli borçlarda önce eklenen kapanır", () => {
    const sameDay = [
      { id: 7, dueDate: "2026-10-10", amountKurus: 100 },
      { id: 5, dueDate: "2026-10-10", amountKurus: 100 },
    ];
    expect(allocatePayments(sameDay, 100).map((c) => [c.id, c.status])).toEqual([
      [5, "paid"],
      [7, "unpaid"],
    ]);
  });

  it("girdi dizisini değiştirmez", () => {
    const input = [...charges];
    allocatePayments(input, 50_000);
    expect(input).toEqual(charges);
  });
});

describe("sumKurus", () => {
  it("tutarları toplar", () => {
    expect(sumKurus(charges)).toBe(150_000);
    expect(sumKurus([])).toBe(0);
  });
});
