import { z } from "zod";
import {
  amountKurusSchema,
  idSchema,
  isoDateSchema,
  optionalText,
  periodSchema,
} from "../../shared/validation.js";

export const createPaymentSchema = z.object({
  apartmentId: idSchema,
  amountKurus: amountKurusSchema,
  paidAt: isoDateSchema,
  method: z.enum(["cash", "transfer"], { error: "Ödeme şekli nakit veya havale olmalı." }),
  note: optionalText(200).transform((value) => value ?? null),
});

export const paymentListQuerySchema = z.object({
  period: periodSchema.optional(),
  apartmentId: idSchema.optional(),
});
