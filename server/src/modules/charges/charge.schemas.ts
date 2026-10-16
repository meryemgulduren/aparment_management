import { z } from "zod";
import {
  amountKurusSchema,
  idSchema,
  isoDateSchema,
  optionalText,
  periodSchema,
} from "../../shared/validation.js";

const chargeFields = {
  kind: z.enum(["dues", "extra"], { error: "Borç türü aidat veya ek ödeme olmalı." }),
  period: periodSchema,
  amountKurus: amountKurusSchema,
  dueDate: isoDateSchema,
  description: optionalText(200).transform((value) => value ?? null),
};

// Ek ödemede (asansör tamiri gibi) neyin borcu olduğu yazılmazsa ileride anlaşılmaz.
function requireDescriptionForExtra(data: { kind: string; description: string | null }) {
  return data.kind !== "extra" || data.description !== null;
}
const descriptionRequired = {
  error: "Ek ödeme için açıklama girilmeli.",
  path: ["description"],
};

/** Tüm dairelere aynı borcu yazmak için. */
export const bulkChargeSchema = z
  .object(chargeFields)
  .refine(requireDescriptionForExtra, descriptionRequired);

/** Tek bir daireye borç yazmak için. */
export const singleChargeSchema = z
  .object({ apartmentId: idSchema, ...chargeFields })
  .refine(requireDescriptionForExtra, descriptionRequired);

export type BulkChargeInput = z.output<typeof bulkChargeSchema>;
