import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { createPaymentSchema, paymentListQuerySchema } from "./payment.schemas.js";
import type { PaymentService } from "./payment.service.js";

export function createPaymentRouter(service: PaymentService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const filter = parseInput(paymentListQuerySchema, req.query);
    res.json(await service.list(filter));
  });

  router.post("/", async (req, res) => {
    const data = parseInput(createPaymentSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
