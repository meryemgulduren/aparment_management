// Sunucu tutarları kuruş (tam sayı) olarak tutar; kullanıcı TL görür ve yazar.
// Ondalıklı sayılarla hesap yapılmaz, çünkü 0.1 + 0.2 gibi işlemler bilgisayarda
// tam sonuç vermez. Dönüşüm yalnızca bu dosyada yapılır.

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 125050 → "₺1.250,50" */
export function formatKurus(kurus: number): string {
  return formatter.format(kurus / 100);
}

/** Forma ön değer yazmak için: 125050 → "1250,50", 120000 → "1200" */
export function kurusToInput(kurus: number): string {
  const lira = Math.trunc(kurus / 100);
  const rest = Math.abs(kurus % 100);
  return rest === 0 ? String(lira) : `${lira},${String(rest).padStart(2, "0")}`;
}

/**
 * Kullanıcının yazdığı tutarı kuruşa çevirir. Geçersizse null döner.
 * Kabul edilenler: "1250", "1250,5", "1.250,50", "1250.50", "₺1.250"
 */
export function parseTl(input: string): number | null {
  let text = input.replace(/[₺\s]/g, "").replace(/TL$/i, "");
  if (text === "") return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // İkisi birden varsa sonda olan ondalık ayırıcıdır.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    text = text.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    text = text.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    // "1.250" ya da "12.500.000": nokta binlik ayırıcı.
    text = text.split(".").join("");
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const kurus = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(kurus) ? kurus : null;
}
