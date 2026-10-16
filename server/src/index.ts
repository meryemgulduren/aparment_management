import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db, pool } from "./db/index.js";

const app = createApp({
  db,
  secureCookie: env.NODE_ENV === "production",
  trustProxy: env.TRUST_PROXY,
});

const server = app.listen(env.PORT, () => {
  console.log(`Sunucu http://localhost:${env.PORT} adresinde çalışıyor`);
});

// Kapatılırken (Ctrl+C veya sunucu yeniden başlatılırken) yarım kalan istekleri
// bitir, sonra veritabanı bağlantılarını düzgünce kapat.
function shutdown(signal: string) {
  console.log(`${signal} alındı, sunucu kapanıyor...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // İstekler 10 saniyede bitmezse zorla kapat.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
