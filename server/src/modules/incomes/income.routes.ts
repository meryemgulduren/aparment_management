import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { createIncomeSchema } from "./income.schemas.js";
import type { IncomeService } from "./income.service.js";

export function createIncomeRouter(service: IncomeService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await service.list());
  });

  router.post("/", async (req, res) => {
    const data = parseInput(createIncomeSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
