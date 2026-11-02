import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  // Neon kullanılmayınca uyur; boşta bağlantıyı uzun tutmanın faydası yok.
  idleTimeoutMillis: 10_000,
});

// Boşta bekleyen bir bağlantı koparsa pool "error" olayı yayar. Dinleyen yoksa
// Node bunu yakalanmamış hata sayar ve sunucuyu kapatır.
pool.on("error", (error) => {
  console.error("Veritabanı bağlantısı koptu:", error.message);
});

// casing ayarı drizzle.config.ts ile aynı olmalı, yoksa sütun adları tutmaz.
export const db = drizzle({ client: pool, schema, casing: "snake_case" });

export type Database = typeof db;
