# TASK-001 — Changes

Durum: planın sekiz adımı da uygulandı. Commit atılmadı; red-team ve doğrulama dalgaları bekliyor.

## Changed files

| Dosya | Değişiklik |
|---|---|
| `.gitignore` | `.env` ve `.ai/context-packs/` eklendi |
| `.env.example` | Yeni: `POSTGRES_PASSWORD`, `DATABASE_URL`, `PORT` (değerler yer tutucu) |
| `.env` | Yeni, git dışı. Şifre `docker-compose.yml` içinden aynı değerle taşındı |
| `docker-compose.yml` | Şifre `${POSTGRES_PASSWORD}` ile okunuyor |
| `server/tsconfig.json` | `module` / `moduleResolution` → `NodeNext` |
| `server/package.json`, `package-lock.json` | `drizzle-orm`, `pg`, `zod`, `drizzle-kit`, `@types/pg`; `db:generate`, `db:migrate`, `db:studio` script'leri |
| `server/src/config/env.ts` | Yeni: `.env` yükleme + Zod doğrulaması |
| `server/src/db/schema.ts` | Yeni: `apartments`, `residents`, `charges`, `payments` ve üç enum |
| `server/src/db/index.ts` | Yeni: `pg` havuzu, havuz hata dinleyicisi, Drizzle örneği (`casing: "snake_case"`) |
| `server/src/index.ts` | Port `env.PORT`'tan okunuyor; `GET /health` eklendi |
| `server/drizzle.config.ts` | Yeni: drizzle-kit ayarı, `casing: "snake_case"` |
| `server/drizzle/0000_bouncy_proudstar.sql` + `meta/` | Üretilen ilk migration |

Branch: `task-001-backend-temeli`.

## Database changes outside migrations

- Görevden önce elle oluşturulmuş `borc` (3 satır) ve `daire` (3 satır) tabloları, sahibinin onayıyla `DROP TABLE` ile silindi.

## Commands and results

| Komut | Sonuç |
|---|---|
| `docker compose config --quiet` | exit 0 |
| `git check-ignore .env` | `.env` (izlenmiyor) |
| `npm run db:generate` | exit 0, 4 tablo |
| `npm run db:migrate` | exit 0 |
| `psql \dt` | yalnızca `apartments`, `charges`, `payments`, `residents` |
| Aynı daire + `2026-10` için ikinci `dues` kaydı (rollback'li) | `duplicate key ... charges_dues_once_per_period` (beklenen) |
| `period = '2026-13'` (rollback'li) | `charges_period_format` hatası (beklenen) |
| `npx tsc --noEmit` | exit 0 |
| `GET /health`, veritabanı ayakta | 200 `{"status":"ok","database":"up"}` |
| `GET /health`, `docker stop` sonrası | 503 `{"status":"error","database":"down"}` |
| `GET /health`, `docker start` sonrası | 200 (sunucu yeniden başlatılmadan) |

## Found and fixed during implementation

- Veritabanı durdurulunca sunucu `Unhandled 'error' event` ile çöküyordu: `pg` havuzu boştaki bağlantı kopunca `error` olayı yayıyor ve dinleyen yoktu. `pool.on("error", ...)` eklendi; test tekrarlandı ve geçti.

## Unresolved concerns

- `npm install` sonrası `npm audit` uyarı bildirdi (geliştirme bağımlılıkları); ayrıntısı incelenmedi.
- Otomatik test yok (plan gereği); kontroller elle yapıldı.
- Sunucu kapanırken havuz kapatılmıyor (graceful shutdown yok).
