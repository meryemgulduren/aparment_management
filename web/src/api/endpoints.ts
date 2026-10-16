import { http } from "./client";
import type {
  Apartment,
  ApartmentDetail,
  ApartmentListItem,
  Charge,
  ChargeKind,
  DuesReport,
  Expense,
  ExpenseCategory,
  Income,
  IncomeKind,
  Payment,
  PaymentListItem,
  PaymentMethod,
  Resident,
  ResidentKind,
  Statement,
  Summary,
  User,
} from "./types";

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const authApi = {
  me: () => http.get<{ user: User }>("/auth/me"),
  login: (username: string, password: string) =>
    http.post<{ user: User }>("/auth/login", { username, password }),
  logout: () => http.post<void>("/auth/logout"),
};

export interface ApartmentInput {
  label: string;
  floor: number | null;
  householdSize: number;
  note: string | null;
}

export const apartmentApi = {
  list: () => http.get<ApartmentListItem[]>("/apartments"),
  get: (id: number) => http.get<ApartmentDetail>(`/apartments/${id}`),
  create: (data: ApartmentInput) => http.post<Apartment>("/apartments", data),
  update: (id: number, data: Partial<ApartmentInput>) =>
    http.patch<Apartment>(`/apartments/${id}`, data),
  delete: (id: number) => http.delete(`/apartments/${id}`),
};

export interface ResidentInput {
  fullName: string;
  phone: string | null;
  kind: ResidentKind;
  note: string | null;
}

export const residentApi = {
  create: (apartmentId: number, data: ResidentInput) =>
    http.post<Resident>("/residents", { ...data, apartmentId }),
  update: (id: number, data: Partial<ResidentInput> & { isActive?: boolean }) =>
    http.patch<Resident>(`/residents/${id}`, data),
  delete: (id: number) => http.delete(`/residents/${id}`),
};

export interface ChargeInput {
  kind: ChargeKind;
  period: string;
  amountKurus: number;
  dueDate: string;
  description: string | null;
}

export const chargeApi = {
  createForAll: (data: ChargeInput) =>
    http.post<{ created: number; skipped: number }>("/charges/bulk", data),
  create: (apartmentId: number, data: ChargeInput) =>
    http.post<Charge>("/charges", { ...data, apartmentId }),
  delete: (id: number) => http.delete(`/charges/${id}`),
  lastDuesAmount: () => http.get<{ amountKurus: number | null }>("/charges/last-dues-amount"),
};

export interface PaymentInput {
  apartmentId: number;
  amountKurus: number;
  paidAt: string;
  method: PaymentMethod;
  note: string | null;
}

export const paymentApi = {
  list: (filter: { period?: string; apartmentId?: number }) =>
    http.get<PaymentListItem[]>(`/payments${query(filter)}`),
  create: (data: PaymentInput) => http.post<Payment>("/payments", data),
  delete: (id: number) => http.delete(`/payments/${id}`),
};

export interface ExpenseInput {
  category: ExpenseCategory;
  amountKurus: number;
  spentAt: string;
  description: string | null;
}

export const expenseApi = {
  list: (period?: string) => http.get<Expense[]>(`/expenses${query({ period })}`),
  create: (data: ExpenseInput) => http.post<Expense>("/expenses", data),
  delete: (id: number) => http.delete(`/expenses/${id}`),
};

export interface IncomeInput {
  kind: IncomeKind;
  amountKurus: number;
  receivedAt: string;
  description: string | null;
}

export const incomeApi = {
  list: () => http.get<Income[]>("/incomes"),
  create: (data: IncomeInput) => http.post<Income>("/incomes", data),
  delete: (id: number) => http.delete(`/incomes/${id}`),
};

export const reportApi = {
  summary: () => http.get<Summary>("/reports/summary"),
  dues: (period: string) => http.get<DuesReport>(`/reports/dues${query({ period })}`),
  statement: (apartmentId: number) => http.get<Statement>(`/reports/statements/${apartmentId}`),
};
