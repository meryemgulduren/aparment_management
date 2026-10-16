import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { bulkChargeSchema, singleChargeSchema } from "./charge.schemas.js";
import type { ChargeService } from "./charge.service.js";

export function createChargeRouter(service: ChargeService): Router {
  const router = Router();

  router.get("/last-dues-amount", async (_req, res) => {
    res.json({ amountKurus: await service.lastDuesAmount() });
  });

  router.post("/bulk", async (req, res) => {
    const data = parseInput(bulkChargeSchema, req.body);
    res.status(201).json(await service.createForAllApartments(data));
  });

  router.post("/", async (req, res) => {
    const data = parseInput(singleChargeSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
