// Borç / ödeme hesabı. Bu dosya veritabanını, HTTP'yi bilmez; yalnızca sayılarla
// çalışır. Bu yüzden kolayca test edilir (ledger.test.ts).
//
// Kural: Ödemeler belirli bir aya bağlanmaz. Bir dairenin toplam ödemesi, en eski
// borçtan başlayarak borçları sırayla kapatır. Böylece "Ekim aidatı ödendi mi?"
// sorusu, kimsenin ödemeyi elle bir aya eşlemesine gerek kalmadan cevaplanır.

export type ChargeStatus = "paid" | "partial" | "unpaid";

export interface LedgerCharge {
  id: number;
  dueDate: string;
  amountKurus: number;
}

export type AllocatedCharge<T extends LedgerCharge> = T & {
  paidKurus: number;
  status: ChargeStatus;
};

export function sumKurus(items: readonly { amountKurus: number }[]): number {
  return items.reduce((total, item) => total + item.amountKurus, 0);
}

/** Toplam ödemeyi, son ödeme tarihi en eski olan borçtan başlayarak dağıtır. */
export function allocatePayments<T extends LedgerCharge>(
  charges: readonly T[],
  totalPaidKurus: number,
): AllocatedCharge<T>[] {
  const ordered = [...charges].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id,
  );
  let remaining = Math.max(totalPaidKurus, 0);
  return ordered.map((charge) => {
    const paidKurus = Math.min(charge.amountKurus, remaining);
    remaining -= paidKurus;
    const status: ChargeStatus =
      paidKurus === charge.amountKurus ? "paid" : paidKurus > 0 ? "partial" : "unpaid";
    return { ...charge, paidKurus, status };
  });
}
