import type { ChargeStatus, DuesStatus, ExpenseCategory, IncomeKind, PaymentMethod, ResidentKind } from "../api/types";

// Sunucudan gelen İngilizce kodların ekranda görünen Türkçe karşılıkları.

export const residentKindLabels: Record<ResidentKind, string> = {
  owner: "Ev sahibi",
  tenant: "Kiracı",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Nakit",
  transfer: "Havale / EFT",
};

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  electricity: "Elektrik",
  water: "Su",
  natural_gas: "Doğalgaz",
  cleaning: "Temizlik",
  elevator: "Asansör",
  maintenance: "Bakım / Tamir",
  management: "Yönetim gideri",
  other: "Diğer",
};

export const incomeKindLabels: Record<IncomeKind, string> = {
  opening_balance: "Kasa devri",
  other: "Diğer gelir",
};

export const chargeStatusLabels: Record<DuesStatus, string> = {
  paid: "Ödendi",
  partial: "Kısmen",
  unpaid: "Ödenmedi",
  none: "Yazılmadı",
};

export const chargeStatusTone: Record<DuesStatus | ChargeStatus, "good" | "warn" | "bad" | "muted"> = {
  paid: "good",
  partial: "warn",
  unpaid: "bad",
  none: "muted",
};
