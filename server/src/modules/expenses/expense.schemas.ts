import { z } from "zod";
import { expenseCategory } from "../../db/schema.js";
import {
  amountKurusSchema,
  isoDateSchema,
  optionalText,
  periodSchema,
} from "../../shared/validation.js";

export const createExpenseSchema = z.object({
  // Kategori listesi tek yerde (veritabanı enum'u) tanımlı; burada tekrar yazılmaz.
  category: z.enum(expenseCategory.enumValues, { error: "Gider kategorisi seçilmeli." }),
  amountKurus: amountKurusSchema,
  spentAt: isoDateSchema,
  description: optionalText(200).transform((value) => value ?? null),
});

export const expenseListQuerySchema = z.object({
  period: periodSchema.optional(),
});
