const TIME_ZONE = "Europe/Istanbul";

const PERIOD_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Adres çubuğundan gelen ay değeri geçerliyse onu, değilse bu ayı döner. */
export function periodOrCurrent(value: string | null): string {
  return value && PERIOD_PATTERN.test(value) ? value : currentPeriod();
}

/** Bugün, "YYYY-AA-GG" (İstanbul saatine göre). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Bu ay, "YYYY-AA". */
export function currentPeriod(): string {
  return todayIso().slice(0, 7);
}

/** "2026-10" → "2026-11" (delta = 1) veya "2026-09" (delta = -1) */
export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** "2026-10" → "Ekim 2026" */
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/** "2026-10-05" → "5 Eki 2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Bir ayın belirli günü, ay o kadar uzun değilse son günü: ("2026-02", 31) → "2026-02-28" */
export function dayOfPeriod(period: string, day: number): string {
  const [year, month] = period.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${period}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}
