import { describe, expect, it } from "vitest";
import { currentPeriod, PERIOD_PATTERN, periodRange, todayIso } from "./dates.js";

describe("todayIso", () => {
  it("İstanbul saatine göre günü verir", () => {
    // UTC 31 Aralık 22:30 = İstanbul 1 Ocak 01:30
    const now = new Date("2026-12-31T22:30:00Z");
    expect(todayIso(now)).toBe("2027-01-01");
    expect(currentPeriod(now)).toBe("2027-01");
  });
});

describe("periodRange", () => {
  it("ay başı ve sonraki ay başı", () => {
    expect(periodRange("2026-10")).toEqual({ start: "2026-10-01", end: "2026-11-01" });
  });

  it("aralık ayında yıl atlar", () => {
    expect(periodRange("2026-12")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
  });
});

describe("PERIOD_PATTERN", () => {
  it.each(["2026-01", "2026-12"])("%s geçerli", (value) => {
    expect(PERIOD_PATTERN.test(value)).toBe(true);
  });
  it.each(["2026-13", "2026-00", "2026-1", "26-10", "2026-10-01"])("%s geçersiz", (value) => {
    expect(PERIOD_PATTERN.test(value)).toBe(false);
  });
});
