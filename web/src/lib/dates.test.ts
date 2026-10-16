import { describe, expect, it } from "vitest";
import { currentPeriod, dayOfPeriod, periodOrCurrent, shiftPeriod } from "./dates";

describe("shiftPeriod", () => {
  it("ay ileri/geri alır, yıl sınırını geçer", () => {
    expect(shiftPeriod("2026-10", 1)).toBe("2026-11");
    expect(shiftPeriod("2026-12", 1)).toBe("2027-01");
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
  });
});

describe("dayOfPeriod", () => {
  it("ay kısaysa son güne yuvarlar", () => {
    expect(dayOfPeriod("2026-02", 31)).toBe("2026-02-28");
    expect(dayOfPeriod("2028-02", 30)).toBe("2028-02-29");
    expect(dayOfPeriod("2026-10", 10)).toBe("2026-10-10");
  });
});

describe("periodOrCurrent", () => {
  it("geçersiz değerde bu aya döner", () => {
    expect(periodOrCurrent("2026-07")).toBe("2026-07");
    expect(periodOrCurrent("abc")).toBe(currentPeriod());
    expect(periodOrCurrent("2026-13")).toBe(currentPeriod());
    expect(periodOrCurrent(null)).toBe(currentPeriod());
  });
});
