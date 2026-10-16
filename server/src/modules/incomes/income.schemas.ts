import { z } from "zod";
import { amountKurusSchema, isoDateSchema, optionalText } from "../../shared/validation.js";

export const createIncomeSchema = z
  .object({
    kind: z.enum(["opening_balance", "other"], { error: "Kasa devri veya diğer gelir seçilmeli." }),
    amountKurus: amountKurusSchema,
    receivedAt: isoDateSchema,
    description: optionalText(200).transform((value) => value ?? null),
  })
  // "Diğer gelir"in ne olduğu yazılmazsa ileride anlaşılmaz.
  .refine((data) => data.kind !== "other" || data.description !== null, {
    error: "Gelirin ne olduğunu yazın.",
    path: ["description"],
  });
