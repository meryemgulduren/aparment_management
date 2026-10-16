import { useSearchParams } from "react-router";
import { formatPeriod, periodOrCurrent, shiftPeriod } from "../lib/dates";

/**
 * Seçili ay adres çubuğunda (?ay=2026-10) tutulur. Böylece bir kayda girip geri
 * dönüldüğünde aynı ay açık kalır.
 */
export function usePeriodParam(): [string, (period: string) => void] {
  const [params, setParams] = useSearchParams();
  const period = periodOrCurrent(params.get("ay"));
  return [period, (next) => setParams({ ay: next }, { replace: true })];
}

export function MonthSwitcher({ period, onChange }: { period: string; onChange(period: string): void }) {
  return (
    <div className="month-switcher">
      <button type="button" aria-label="Önceki ay" onClick={() => onChange(shiftPeriod(period, -1))}>
        ‹
      </button>
      <span className="label">{formatPeriod(period)}</span>
      <button type="button" aria-label="Sonraki ay" onClick={() => onChange(shiftPeriod(period, 1))}>
        ›
      </button>
    </div>
  );
}
