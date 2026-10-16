import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { createExpenseSchema, expenseListQuerySchema } from "./expense.schemas.js";
import type { ExpenseService } from "./expense.service.js";

export function createExpenseRouter(service: ExpenseService): Router {
  const router = Router();

  router.get("/", async (req, res) => {
    const { period } = parseInput(expenseListQuerySchema, req.query);
    res.json(await service.list(period));
  });

  router.post("/", async (req, res) => {
    const data = parseInput(createExpenseSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
