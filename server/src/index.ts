import express from "express";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { db } from "./db/index.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Apartman yönetim sistemi çalışıyor");
});

app.get("/health", async (req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: "ok", database: "up" });
  } catch (error) {
    console.error("Veritabanına ulaşılamadı:", error);
    res.status(503).json({ status: "error", database: "down" });
  }
});

app.listen(env.PORT, () => {
  console.log(`Sunucu http://localhost:${env.PORT} adresinde çalışıyor`);
});
