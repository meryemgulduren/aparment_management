import { Router } from "express";
import { idParamsSchema, parseInput } from "../../shared/validation.js";
import { createApartmentSchema, updateApartmentSchema } from "./apartment.schemas.js";
import type { ApartmentService } from "./apartment.service.js";

export function createApartmentRouter(service: ApartmentService): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    res.json(await service.list());
  });

  router.post("/", async (req, res) => {
    const data = parseInput(createApartmentSchema, req.body);
    res.status(201).json(await service.create(data));
  });

  router.get("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    res.json(await service.get(id));
  });

  router.patch("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    const changes = parseInput(updateApartmentSchema, req.body);
    res.json(await service.update(id, changes));
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parseInput(idParamsSchema, req.params);
    await service.delete(id);
    res.status(204).end();
  });

  return router;
}
