import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// .env proje kökünde duruyor (docker-compose ile ortak), bu dosya ise server/src/config içinde.
const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

// Vercel bu değişkeni kendisi tanımlar; bazı varsayılanlar ona göre seçilir.
const onVercel = Boolean(process.env.VERCEL);

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3000),
  // "production" iken oturum çerezi yalnızca HTTPS üzerinden gönderilir.
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Sunucu Nginx gibi bir ters vekilin (reverse proxy) arkasındaysa "true" yapılır;
  // yoksa giriş deneme sınırı herkesi vekilin IP'si sanır.
  // Vercel her zaman bir vekilin arkasındadır.
  TRUST_PROXY: z.stringbool().default(onVercel),
  // Sunucusuz ortamda her kopya kendi havuzunu açar; küçük tutulur.
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(onVercel ? 3 : 10),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Ortam değişkenleri hatalı veya eksik:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
