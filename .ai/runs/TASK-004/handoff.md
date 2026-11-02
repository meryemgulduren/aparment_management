# TASK-004 — Handoff

## Status

`implementing` — kod hazır ve yerelde doğrulandı; sahibin hesapları (GitHub, Neon, Vercel) açması bekleniyor. Commit atılmadı. Branch: `task-004-yayin` (TASK-003 commit'i `408fa98` üzerinde).

## Done

- Marka adı "Acar Apartmanı" (`web/src/lib/brand.ts`, `index.html`, manifest)
- `server/src/app.ts` → `create-app.ts`; `src/index.ts` `export default app`, `VERCEL` yokken listen + kapanış
- `env.ts`: `TRUST_PROXY` ve `DATABASE_POOL_MAX` varsayılanları Vercel'de otomatik; havuz `idleTimeoutMillis: 10s`
- `drizzle.config.ts`: `.env` yoksa çökmez
- Giriş deneme sınırı `login_attempts` tablosunda (IP SHA-256 özeti, atomik upsert); `LoginLimiter` → `AttemptStore` arayüzü (`MemoryAttemptStore` testlerde); migration `0003_giris_denemeleri`
- `server/vercel.json`: build komutu, `fra1` bölgesi, SPA yönlendirmesi (`/api`, `/health` hariç), güvenlik başlıkları, `/assets` önbellek
- `server/scripts/vercel-build.mjs`: arayüzü `server/public`e derler; migration yalnızca `VERCEL_ENV=production`
- `npm run backup`, `backup:prod`, `admin:prod` (canlı adres git dışı `.env.production`dan)
- `.gitignore`: `server/public/`, `backups/`, `.vercel/`, `.env.*` (`.env.example` hariç)
- `DEPLOY.md`, README güncellemesi

## Evidence

| Kontrol | Sonuç |
|---|---|
| server `tsc`, `vitest` | exit 0; 7 dosya, 46 test |
| web `tsc`, `vitest`, `build:vercel` | exit 0; 22 test; çıktı `server/public` |
| `vercel.json` yönlendirme regex testi | 11/11 yol doğru (sayfalar → index.html, /api ve /health → Express) |
| `VERCEL=1` taklidi | default export Express; listen/kapanış dinleyicisi yok; /health 200 |
| DB tabanlı limiter | 10 hatadan sonra 429; başka IP 401; yeni kopyada doğru şifreyle bile 429; DB'de IP düz metin yok |
| `backup:prod` (`.env.production` ile, `DATABASE_URL` boşken) | yedek yazıldı, şifre özetleri yok, Türkçe doğru |
| Ekran görüntüsü (1280 / 360 / giriş) | "Acar Apartmanı" sığıyor, hata yok |

## Not verified (Vercel'de ilk yayında bakılacak)

- Vercel'in `src/index.ts`'i Express girişi olarak algılaması ve TS/NodeNext `.js` importlarını derlemesi
- `vercel.json` rewrites'ın Express fonksiyonuyla birlikte beklendiği gibi çalışması
- Neon pooled adresiyle bağlantı ve `drizzle-kit migrate`in derleme sırasında çalışması

## Next action

1. Sahip GitHub depo adresini iletir → commit, `main`e birleştirme, push (sahip onayıyla).
2. Sahip Neon + Vercel'i `DEPLOY.md`ye göre kurar; ilk derleme kayıtları birlikte incelenir.
3. `npm run admin:prod` ile gerçek yönetici hesabı.
