// Apartman Türkiye'de; "bugün" ve "bu ay" sunucunun saat dilimine göre değil,
// İstanbul saatine göre hesaplanır.
const TIME_ZONE = "Europe/Istanbul";

// "2026-10" gibi bir ay. Veritabanındaki charges_period_format kısıtıyla aynı kural.
export const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Bugünün tarihi, "YYYY-AA-GG". */
export function todayIso(now = new Date()): string {
  return isoDateFormatter.format(now);
}

/** İçinde bulunulan ay, "YYYY-AA". */
export function currentPeriod(now = new Date()): string {
  return todayIso(now).slice(0, 7);
}

/** Bir ayın ilk günü (dahil) ve sonraki ayın ilk günü (hariç). */
export function periodRange(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    start: `${period}-01`,
    end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}
