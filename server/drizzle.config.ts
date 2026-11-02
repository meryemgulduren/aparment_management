import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Yerelde ayarlar proje kökündeki .env'den gelir. Vercel'de bu dosya yoktur;
// DATABASE_URL ortam değişkeni olarak verilir.
if (existsSync("../.env")) {
  process.loadEnvFile("../.env");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Koddaki camelCase alan adlarını veritabanında snake_case'e çevirir.
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
