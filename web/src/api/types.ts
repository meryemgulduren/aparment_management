// Sunucunun döndürdüğü verilerin biçimi. Tutarlar her zaman kuruş cinsinden tam sayı.

export type ResidentKind = "owner" | "tenant";
export type ChargeKind = "dues" | "extra";
export type ChargeStatus = "paid" | "partial" | "unpaid";
export type DuesStatus = ChargeStatus | "none";
export type PaymentMethod = "cash" | "transfer";
export type IncomeKind = "opening_balance" | "other";
export type ExpenseCategory =
  | "electricity"
  | "water"
  | "natural_gas"
  | "cleaning"
  | "elevator"
  | "maintenance"
  | "management"
  | "other";

export interface User {
  id: number;
  username: string;
}

export interface Apartment {
  id: number;
  label: string;
  floor: number | null;
  householdSize: number;
  note: string | null;
}

export interface Resident {
  id: number;
  apartmentId: number;
  fullName: string;
  phone: string | null;
  kind: ResidentKind;
  isActive: boolean;
  note: string | null;
}

export interface ApartmentListItem extends Apartment {
  balanceKurus: number;
  activeResidents: Pick<Resident, "id" | "fullName" | "kind" | "phone">[];
}

export interface ApartmentDetail extends Apartment {
  residents: Resident[];
}

export interface Charge {
  id: number;
  apartmentId: number;
  kind: ChargeKind;
  period: string;
  amountKurus: number;
  dueDate: string;
  description: string | null;
}

export interface StatementCharge extends Charge {
  paidKurus: number;
  status: ChargeStatus;
}

export interface Payment {
  id: number;
  apartmentId: number;
  amountKurus: number;
  paidAt: string;
  method: PaymentMethod;
  note: string | null;
}

export interface PaymentListItem extends Payment {
  apartmentLabel: string;
}

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amountKurus: number;
  spentAt: string;
  description: string | null;
}

export interface Income {
  id: number;
  kind: IncomeKind;
  amountKurus: number;
  receivedAt: string;
  description: string | null;
}

export interface Statement {
  apartment: Apartment;
  totalChargedKurus: number;
  totalPaidKurus: number;
  balanceKurus: number;
  charges: StatementCharge[];
  payments: Payment[];
}

export interface Summary {
  period: string;
  cashBalanceKurus: number;
  totalCollectedKurus: number;
  totalIncomeKurus: number;
  totalExpensesKurus: number;
  totalReceivableKurus: number;
  totalAdvanceKurus: number;
  monthCollectedKurus: number;
  monthIncomeKurus: number;
  monthExpensesKurus: number;
  apartmentCount: number;
  householdTotal: number;
  debtors: { id: number; label: string; balanceKurus: number }[];
}

export interface DuesRow {
  apartmentId: number;
  label: string;
  residentNames: string[];
  status: DuesStatus;
  amountKurus: number;
  paidKurus: number;
  balanceKurus: number;
}

export interface DuesReport {
  period: string;
  counts: Record<DuesStatus, number>;
  rows: DuesRow[];
}
