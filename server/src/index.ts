// Uygulamanın giriş noktası. İki ortamda çalışır:
// - Vercel: bu dosyanın varsayılan dışa aktarımını (export default) alır ve her
//   isteği uygulamaya kendisi verir. Burada port dinlemeyiz.
// - Yerel / kendi sunucumuz: aşağıdaki listen bloğu sunucuyu başlatır.
import { createApp } from "./create-app.js";
import { env } from "./config/env.js";
import { db, pool } from "./db/index.js";

const app = createApp({
  db,
  secureCookie: env.NODE_ENV === "production",
  trustProxy: env.TRUST_PROXY,
});

export default app;

// Vercel bu değişkeni kendisi tanımlar.
if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    console.log(`Sunucu http://localhost:${env.PORT} adresinde çalışıyor`);
  });

  // Kapatılırken (Ctrl+C veya sunucu yeniden başlatılırken) yarım kalan istekleri
  // bitir, sonra veritabanı bağlantılarını düzgünce kapat.
  const shutdown = (signal: string) => {
    console.log(`${signal} alındı, sunucu kapanıyor...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    // İstekler 10 saniyede bitmezse zorla kapat.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
