import { z } from "zod";
import { idSchema, optionalText } from "../../shared/validation.js";

const fullName = z
  .string()
  .trim()
  .min(2, { error: "Ad soyad en az 2 karakter olmalı." })
  .max(100, { error: "Ad soyad en fazla 100 karakter olabilir." });
const phone = optionalText(20).refine((value) => !value || /^[0-9+()\s-]{7,20}$/.test(value), {
  error: "Telefon numarası yalnızca rakam, boşluk, +, -, ( ) içerebilir.",
});
const kind = z.enum(["owner", "tenant"], { error: "Ev sahibi veya kiracı seçilmeli." });
const note = optionalText(500);

export const createResidentSchema = z.object({
  apartmentId: idSchema,
  fullName,
  phone: phone.transform((value) => value ?? null),
  kind,
  note: note.transform((value) => value ?? null),
});

// Daire değiştirilemez: taşınan kişi pasife alınır, yeni dairede yeni kayıt açılır.
export const updateResidentSchema = z
  .object({ fullName, phone, kind, note, isActive: z.boolean() })
  .partial();
