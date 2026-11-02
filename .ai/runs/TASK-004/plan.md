# TASK-004 — Plan: Acar Apartmanı olarak Vercel + Neon'da yayın

Owner: Meryem Gulduren · 2026-11-02 · Branch: `task-004-yayin`

## Goal

Siteyi "Acar Apartmanı" adıyla, ücretsiz olarak Vercel (uygulama) + Neon (PostgreSQL) üzerinde çalışır hale getirmek. Hesapları sahip açacak; kod tarafı bu görevde hazırlanır.

## Changes

1. **Marka adı:** arayüzdeki "Apartman" → "Acar Apartmanı" (tek sabit: `web/src/lib/brand.ts`), sayfa başlığı ve uygulama manifesti.
2. **Vercel giriş noktası:** `server/src/app.ts` → `create-app.ts` (Vercel `src/app.ts`'i giriş sanmasın). `src/index.ts` uygulamayı `export default` eder; yerelde ayrıca `listen` + düzgün kapanış yapar, Vercel'de yapmaz.
3. **Arayüz dosyaları:** Vercel `express.static` çalıştırmıyor; derlenmiş arayüz `server/public/` içine yazılır ve CDN'den sunulur. SPA adresleri (`/daireler/2`) için `vercel.json` yönlendirmesi; statik dosyalara güvenlik başlıkları (CSP, HSTS vb.) `vercel.json`'dan.
4. **Giriş deneme sınırı veritabanına:** Vercel'de bellek istekler arasında güvenilir paylaşılmaz. `login_attempts` tablosu (IP'nin SHA-256 özeti, hata sayısı, sıfırlanma zamanı), atomik upsert. `LoginLimiter` depolama arayüzüne bağımlı (testte bellek, canlıda veritabanı).
5. **Veritabanı bağlantısı:** sunucusuz ortamda küçük havuz (`DATABASE_POOL_MAX`), Neon'un pooled adresi + `sslmode=require`.
6. **Migration:** Vercel'de yalnızca production derlemesinde otomatik (`VERCEL_ENV=production`); `drizzle.config.ts` `.env` yoksa çökmeyecek.
7. **Yedek:** `npm run backup` tüm tabloları tarihli JSON dosyasına yazar (`backups/`, git dışı).
8. **Doküman:** `DEPLOY.md` adım adım (GitHub, Neon, Vercel, ortam değişkenleri, ilk yönetici hesabı).

## Non-goals

- Özel alan adı, e-posta, geri yükleme komutu (yedekten geri dönüş) — sonraya.

## Risks

| Risk | Mitigation |
|---|---|
| Vercel'in Express algılaması beklenenden farklı | Tek aday giriş dosyası; ilk yayında kayıtlara bakılır |
| SPA yönlendirmesi API'yi yutar | Yönlendirme `/api` ve `/health` hariç; yerelde `vercel.json` kuralı ayrıca test edilir |
| Önizleme dağıtımları canlı veritabanını değiştirir | `DATABASE_URL` yalnızca Production ortamına girilir; migration yalnızca production'da |
| Veritabanı şifresinin sohbete/dosyaya yazılması | Sahibe şifreyi sohbete yapıştırmamasını söyle; yalnızca Vercel ayarlarına ve git dışı yerel dosyaya |

## Verification

- server `tsc`, testler (yeni: veritabanı tabanlı limiter mantığı), web build + testler
- Yerel üretim provası: `NODE_ENV=production` ile derlenmiş arayüz + API; giriş deneme sınırı veritabanında; 429 sonrası yeniden başlatmada da kalıcı
- `vercel.json` yönlendirme kurallarının regex testi
