import { describe, expect, it } from "vitest";
import { formatKurus, kurusToInput, parseTl } from "./money";

describe("parseTl", () => {
  it.each([
    ["1250", 125_000],
    ["1250,5", 125_050],
    ["1250,50", 125_050],
    ["1.250,50", 125_050],
    ["1250.50", 125_050],
    ["1.250", 125_000],
    ["12.500.000", 1_250_000_000],
    ["1,250.75", 125_075],
    ["₺ 1.250", 125_000],
    ["1250 TL", 125_000],
    ["0,01", 1],
  ])("%s → %d kuruş", (input, expected) => {
    expect(parseTl(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "1,2,3", "-50", "1.2.3,4.5"])("%s geçersiz", (input) => {
    expect(parseTl(input)).toBeNull();
  });
});

describe("formatKurus / kurusToInput", () => {
  it("TL olarak gösterir", () => {
    expect(formatKurus(125_050).replace(/\s/g, "")).toBe("₺1.250,50");
  });

  it("forma geri yazılabilir değer üretir", () => {
    expect(kurusToInput(120_000)).toBe("1200");
    expect(kurusToInput(125_050)).toBe("1250,50");
    expect(parseTl(kurusToInput(125_005))).toBe(125_005);
  });
});
