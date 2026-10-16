import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { createResidentSchema, updateResidentSchema } from "./resident.schemas.js";
import type { ResidentService } from "./resident.service.js";

export function createResidentRouter(service: ResidentService): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const data = parseInput(createResidentSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.patch("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    const changes = parseInput(updateResidentSchema, req.body);
    res.json(await service.update(id, changes));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
