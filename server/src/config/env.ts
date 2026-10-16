import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// .env proje kökünde duruyor (docker-compose ile ortak), bu dosya ise server/src/config içinde.
const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Ortam değişkenleri hatalı veya eksik:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
