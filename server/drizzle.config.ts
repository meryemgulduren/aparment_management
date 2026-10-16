import { defineConfig } from "drizzle-kit";

process.loadEnvFile("../.env");

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
