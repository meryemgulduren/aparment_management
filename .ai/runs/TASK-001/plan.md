# TASK-001 — Plan

## Summary

Express sunucusunu Drizzle üzerinden PostgreSQL'e bağlamak ve borç takibinin dayanacağı dört tabloyu migration ile oluşturmak. Endpoint ve arayüz yok; yalnızca temel.

## Proposed change

1. **Ayarlar ve gizli bilgiler.** Kökte `.env` (git dışı) ve `.env.example` oluştur. `docker-compose.yml` şifreyi `${POSTGRES_PASSWORD}` ile okusun. `.gitignore`'a `.env` ve `.ai/context-packs/` ekle.
2. **TypeScript ayarı.** `server/tsconfig.json`: `module` ve `moduleResolution` → `NodeNext`.
3. **Paketler.** `drizzle-orm`, `pg`, `zod`; geliştirme için `drizzle-kit`, `@types/pg`.
4. **Ayar modülü.** `server/src/config/env.ts`: `.env`'i Node'un yerleşik `process.loadEnvFile` ile yükle, `DATABASE_URL` ve `PORT`'u Zod ile doğrula. Eksikse sunucu açılışta anlaşılır hatayla dursun.
5. **Şema.** `server/src/db/schema.ts`:
   - `apartments`: `id`, `label` (kapı no, benzersiz), `floor` (boş olabilir), `created_at`
   - `residents`: `id`, `apartment_id`, `full_name`, `phone`, `kind` (malik / kiracı), `is_active`, `created_at`
   - `charges`: `id`, `apartment_id`, `kind` (aidat / ek), `period` (`YYYY-MM`), `amount_kurus`, `due_date`, `description`, `created_at`; aidat için `(apartment_id, period)` benzersiz
   - `payments`: `id`, `apartment_id`, `amount_kurus`, `paid_at`, `method` (nakit / havale), `note`, `created_at`
   - Tutarlar için `amount_kurus > 0` kontrol kısıtı
6. **Bağlantı.** `server/src/db/index.ts`: `pg` havuzu + Drizzle örneği.
7. **Migration.** `server/drizzle.config.ts`; `db:generate`, `db:migrate`, `db:studio` script'leri. İlk migration'ı üret ve uygula.
8. **Sağlık kontrolü.** `GET /health` → `select 1`; başarılıysa 200, değilse 503.

## Affected surfaces

- Files: `.gitignore`, `.env.example`, `docker-compose.yml`, `server/package.json`, `server/package-lock.json`, `server/tsconfig.json`, `server/drizzle.config.ts`, `server/src/index.ts`, `server/src/config/env.ts`, `server/src/db/schema.ts`, `server/src/db/index.ts`, `server/drizzle/` (üretilen migration)
- Interfaces: yeni `GET /health`; yeni ortam değişkenleri `POSTGRES_PASSWORD`, `DATABASE_URL`, `PORT`
- Tests: bu görevde otomatik test yok (iş mantığı yok); Vitest, borç hesabı yazılan görevde eklenecek

## Non-goals

- Giriş, CRUD endpoint'leri, toplu borçlandırma, frontend, deploy
- Aidat tutarının saklanacağı ayar tablosu
- Gecikme tazminatı

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Şifre `.env`'e taşınırken değeri değişirse mevcut Docker volume eski şifreyle kalır | Bağlantı hatası | Aynı değeri taşı; değişecekse volume'u bilinçli sıfırla |
| 5433 portu başka bir konteyner tarafından kullanılıyor olabilir | Veritabanı ayağa kalkmaz | Başlatmadan önce portu kontrol et |
| `NodeNext` göreli import'larda `.js` uzantısı ister | Derleme hataları | Import'ları baştan uzantılı yaz, nedenini açıkla |
| Şema sonradan değişecek | Migration karmaşası | Veri yokken değişiklik ucuz; her değişiklik ayrı migration |
| Eski şifre git geçmişinde | Düşük (yalnızca yerel, 127.0.0.1) | Yayına alırken farklı, güçlü şifre kullan |

## Verification plan

- `docker compose config` şifreyi `.env`'den çözüyor
- `git check-ignore .env` → izlenmiyor
- `npm run db:generate` ve `npm run db:migrate` → exit 0
- `psql \dt` veya Drizzle Studio ile dört tablo görülüyor
- Aynı daire + dönem için ikinci aidat kaydı denemesi kısıt hatası veriyor
- `curl localhost:3000/health` → 200; veritabanı durdurulunca 503
- `npx tsc --noEmit` → exit 0

## Open questions

- Bir dairede aynı anda hem malik hem kiracı kayıtlı olabilsin mi? (Varsayım: evet, ikisi de aktif olabilir.)
- Dönem `YYYY-MM` metni olarak mı, ayın ilk günü tarihi olarak mı tutulsun? (Varsayım: `YYYY-MM` metni + biçim kontrolü.)
