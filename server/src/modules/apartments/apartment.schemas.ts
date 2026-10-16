import { z } from "zod";
import { optionalText } from "../../shared/validation.js";

const label = z
  .string()
  .trim()
  .min(1, { error: "Kapı numarası girilmeli." })
  .max(20, { error: "Kapı numarası en fazla 20 karakter olabilir." });
const floor = z.number().int().min(-5).max(100).nullable();
const householdSize = z
  .number()
  .int()
  .min(0, { error: "Kişi sayısı negatif olamaz." })
  .max(50, { error: "Kişi sayısı en fazla 50 olabilir." });
const note = optionalText(500);

export const createApartmentSchema = z.object({
  label,
  floor: floor.default(null),
  householdSize: householdSize.default(0),
  note: note.transform((value) => value ?? null),
});

// Güncellemede her alan isteğe bağlı: yalnızca gönderilenler değişir.
export const updateApartmentSchema = z.object({ label, floor, householdSize, note }).partial();
