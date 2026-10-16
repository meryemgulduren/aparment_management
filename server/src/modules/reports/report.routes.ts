import { Router } from "express";
import { z } from "zod";
import { currentPeriod } from "../../shared/dates.js";
import { idParamsSchema, parseInput, periodSchema } from "../../shared/validation.js";
import type { ReportService } from "./report.service.js";

const periodQuerySchema = z.object({ period: periodSchema.optional() });

export function createReportRouter(service: ReportService): Router {
  const router = Router();

  router.get("/summary", async (_req, res) => {
    res.json(await service.summary());
  });

  router.get("/dues", async (req, res) => {
    const { period } = parseInput(periodQuerySchema, req.query);
    res.json(await service.dues(period ?? currentPeriod()));
  });

  router.get("/statements/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    res.json(await service.statement(id));
  });

  return router;
}
