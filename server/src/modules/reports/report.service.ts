import { allocatePayments, sumKurus, type AllocatedCharge, type ChargeStatus } from "../../domain/ledger.js";
import { currentPeriod } from "../../shared/dates.js";
import { NotFoundError } from "../../shared/errors.js";
import type { Apartment, ApartmentRepository } from "../apartments/apartment.repository.js";
import { compareApartmentLabels } from "../apartments/apartment.service.js";
import type { Charge, ChargeRepository } from "../charges/charge.repository.js";
import type { ExpenseRepository } from "../expenses/expense.repository.js";
import type { IncomeRepository } from "../incomes/income.repository.js";
import type { Payment, PaymentRepository } from "../payments/payment.repository.js";
import type { ResidentRepository } from "../residents/resident.repository.js";

export interface Summary {
  period: string;
  /** Kasadaki para: tahsilatlar + kasaya eklenen paralar − giderler. */
  cashBalanceKurus: number;
  /** Kasa dökümü (tüm zamanlar). */
  totalCollectedKurus: number;
  totalIncomeKurus: number;
  totalExpensesKurus: number;
  /** Dairelerin toplam borcu (yalnızca borçlu daireler). */
  totalReceivableKurus: number;
  /** Fazla ödeme yapan dairelerin toplam alacağı. */
  totalAdvanceKurus: number;
  monthCollectedKurus: number;
  monthIncomeKurus: number;
  monthExpensesKurus: number;
  apartmentCount: number;
  householdTotal: number;
  debtors: { id: number; label: string; balanceKurus: number }[];
}

export type DuesStatus = ChargeStatus | "none";

export interface DuesRow {
  apartmentId: number;
  label: string;
  residentNames: string[];
  /** "none": bu ay için aidat yazılmamış. */
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

export interface Statement {
  apartment: Apartment;
  totalChargedKurus: number;
  totalPaidKurus: number;
  balanceKurus: number;
  /** En yeni borç en üstte. */
  charges: AllocatedCharge<Charge>[];
  payments: Payment[];
}

export interface ReportDependencies {
  apartments: Pick<ApartmentRepository, "listWithBalances" | "findById">;
  residents: Pick<ResidentRepository, "listActive">;
  charges: Pick<ChargeRepository, "listAll" | "listByApartment">;
  payments: Pick<PaymentRepository, "listByApartment" | "totalsByApartment" | "sum">;
  expenses: Pick<ExpenseRepository, "sum">;
  incomes: Pick<IncomeRepository, "sum">;
}

/** Yalnızca okur; hiçbir kaydı değiştirmez. */
export class ReportService {
  private readonly deps: ReportDependencies;

  constructor(deps: ReportDependencies) {
    this.deps = deps;
  }

  async summary(period = currentPeriod()): Promise<Summary> {
    const { apartments, payments, expenses, incomes } = this.deps;
    const [list, totalPaid, totalIncome, totalSpent, monthCollected, monthIncome, monthSpent] =
      await Promise.all([
        apartments.listWithBalances(),
        payments.sum(),
        incomes.sum(),
        expenses.sum(),
        payments.sum(period),
        incomes.sum(period),
        expenses.sum(period),
      ]);

    const debtors = list
      .filter((apartment) => apartment.balanceKurus > 0)
      .sort((a, b) => b.balanceKurus - a.balanceKurus)
      .map(({ id, label, balanceKurus }) => ({ id, label, balanceKurus }));

    return {
      period,
      cashBalanceKurus: totalPaid + totalIncome - totalSpent,
      totalCollectedKurus: totalPaid,
      totalIncomeKurus: totalIncome,
      totalExpensesKurus: totalSpent,
      totalReceivableKurus: debtors.reduce((total, d) => total + d.balanceKurus, 0),
      totalAdvanceKurus: list
        .filter((apartment) => apartment.balanceKurus < 0)
        .reduce((total, apartment) => total - apartment.balanceKurus, 0),
      monthCollectedKurus: monthCollected,
      monthIncomeKurus: monthIncome,
      monthExpensesKurus: monthSpent,
      apartmentCount: list.length,
      householdTotal: list.reduce((total, apartment) => total + apartment.householdSize, 0),
      debtors,
    };
  }

  /** Seçilen ayın aidatını hangi dairenin ödediğini gösterir. */
  async dues(period: string): Promise<DuesReport> {
    const { apartments, residents, charges, payments } = this.deps;
    const [list, activeResidents, allCharges, paidTotals] = await Promise.all([
      apartments.listWithBalances(),
      residents.listActive(),
      charges.listAll(),
      payments.totalsByApartment(),
    ]);

    const chargesByApartment = groupBy(allCharges, (charge) => charge.apartmentId);
    const namesByApartment = new Map<number, string[]>();
    // Kiracı önce: dairede fiilen oturan kişi odur.
    const tenantsFirst = [...activeResidents].sort(
      (a, b) => Number(b.kind === "tenant") - Number(a.kind === "tenant"),
    );
    for (const resident of tenantsFirst) {
      const names = namesByApartment.get(resident.apartmentId) ?? [];
      names.push(resident.fullName);
      namesByApartment.set(resident.apartmentId, names);
    }

    const counts: Record<DuesStatus, number> = { paid: 0, partial: 0, unpaid: 0, none: 0 };
    const rows = [...list].sort(compareApartmentLabels).map((apartment): DuesRow => {
      const allocated = allocatePayments(
        chargesByApartment.get(apartment.id) ?? [],
        paidTotals.get(apartment.id) ?? 0,
      );
      const dues = allocated.find((charge) => charge.kind === "dues" && charge.period === period);
      const status: DuesStatus = dues?.status ?? "none";
      counts[status] += 1;
      return {
        apartmentId: apartment.id,
        label: apartment.label,
        residentNames: namesByApartment.get(apartment.id) ?? [],
        status,
        amountKurus: dues?.amountKurus ?? 0,
        paidKurus: dues?.paidKurus ?? 0,
        balanceKurus: apartment.balanceKurus,
      };
    });

    return { period, counts, rows };
  }

  /** Bir dairenin tüm borç ve ödemeleri; her borcun ödenip ödenmediğiyle birlikte. */
  async statement(apartmentId: number): Promise<Statement> {
    const { apartments, charges, payments } = this.deps;
    const apartment = await apartments.findById(apartmentId);
    if (!apartment) {
      throw new NotFoundError("Daire bulunamadı.");
    }
    const [apartmentCharges, apartmentPayments] = await Promise.all([
      charges.listByApartment(apartmentId),
      payments.listByApartment(apartmentId),
    ]);

    const totalChargedKurus = sumKurus(apartmentCharges);
    const totalPaidKurus = sumKurus(apartmentPayments);
    return {
      apartment,
      totalChargedKurus,
      totalPaidKurus,
      balanceKurus: totalChargedKurus - totalPaidKurus,
      charges: allocatePayments(apartmentCharges, totalPaidKurus).reverse(),
      payments: apartmentPayments,
    };
  }
}

function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}
