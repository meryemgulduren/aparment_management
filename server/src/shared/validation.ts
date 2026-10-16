import { z } from "zod";
import { PERIOD_PATTERN } from "./dates.js";
import { ValidationError } from "./errors.js";

// Zod'un varsayılan hata mesajları İngilizce; Türkçe olanları da teknik
// ("beklenen string, alınan undefined"). En sık iki durum sadeleştirilir.
z.config(z.locales.tr());
z.config({
  customError: (issue) => {
    if (issue.code !== "invalid_type") return undefined;
    if (issue.input === undefined || issue.input === null) return "Bu alan zorunlu.";
    if (issue.expected === "number") return "Sayı olmalı.";
    return undefined;
  },
});

/**
 * Dışarıdan gelen veriyi (istek gövdesi, URL parametresi) şemaya göre doğrular.
 * Geçersizse hangi alanın neden hatalı olduğunu içeren bir ValidationError fırlatır.
 * Şemada olmayan alanlar atılır; böylece istemci örneğin "id" gönderip değiştiremez.
 */
export function parseInput<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  throw new ValidationError("Girilen bilgiler hatalı.", fields);
}

export const idSchema = z.coerce.number().int().positive();
export const idParamsSchema = z.object({ id: idSchema });

// int sütun sınırının (yaklaşık 21 milyon TL) altında, gerçekçi bir üst sınır.
export const amountKurusSchema = z
  .number()
  .int({ error: "Tutar en fazla iki ondalık basamaklı olmalı." })
  .positive({ error: "Tutar sıfırdan büyük olmalı." })
  .max(1_000_000_000, { error: "Tutar çok büyük." });

export const isoDateSchema = z.iso.date({ error: "Tarih YYYY-AA-GG biçiminde olmalı." });

export const periodSchema = z
  .string()
  .regex(PERIOD_PATTERN, { error: "Dönem YYYY-AA biçiminde olmalı." });

/**
 * İsteğe bağlı serbest metin. Boş metin "değer yok" (null) olarak saklanır.
 * Alan hiç gönderilmezse undefined kalır; güncellemede "dokunma" anlamına gelir.
 */
export function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => (value === undefined ? undefined : value || null));
}
