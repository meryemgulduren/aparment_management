# TASK-002 — Changes

Durum: plan uygulandı, red-team bulguları düzeltildi. Commit atılmadı.

## Changed files

| Alan | Dosyalar |
|---|---|
| Şema | `server/src/db/schema.ts` (+`household_size`, `note` alanları; `expenses`, `users`, `sessions` tabloları), `server/drizzle/0001_asama1.sql` + meta |
| Ayarlar | `server/src/config/env.ts` (+`NODE_ENV`, `TRUST_PROXY`), `.env.example`, `.gitignore` (+`dist/`) |
| Uygulama iskeleti | `server/src/app.ts` (yeni, composition root), `server/src/index.ts` (createApp + kapanış) |
| Ortak | `server/src/shared/{errors,dates,validation,db-errors}.ts`, `server/src/domain/ledger.ts`, `server/src/types/express.d.ts` |
| Middleware | `server/src/middleware/{require-auth,error-handler}.ts` |
| Modüller | `server/src/modules/{auth,apartments,residents,charges,payments,expenses,reports}/` |
| Komut | `server/src/scripts/create-admin.ts`; `package.json` script'leri: `start`, `typecheck`, `test`, `admin` |
| Testler | 6 server test dosyası (40 test), 2 web test dosyası (22 test) |
| Paketler | server: `helmet`, `cookie-parser`, dev `vitest`, `@types/cookie-parser`; web: `react`, `react-dom`, `react-router`, `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@types/react*` |
| Arayüz | `web/` (yeni): `index.html`, `vite.config.ts`, `tsconfig.json`, `public/` (ikon, manifest), `src/` (api, auth, components, hooks, lib, pages, styles.css) |
| Doküman | `README.md` (yeni) |

## Ek: Kasaya para ekleme (sahip isteği, 2026-10-16)

| Alan | Dosyalar |
|---|---|
| Şema | `incomes` tablosu + `income_kind` enum (`opening_balance` / `other`); tek kasa devri için kısmi benzersiz indeks; `server/drizzle/0002_kasa.sql` |
| Backend | `server/src/modules/incomes/` (repository, schemas, service, routes, test); `report.service.ts` kasa = tahsilat + gelir − gider, döküm alanları; `app.ts` bağlama |
| Arayüz | `web/src/pages/cash/{CashPage,IncomeFormPage}.tsx`, `/kasa` ve `/kasa/para-ekle` rotaları, özet kartı Kasa sayfasına bağlantı, `labels.ts`, `types.ts`, `endpoints.ts`, `styles.css` |

## Database changes outside migrations

- Yerel veritabanında `TRUNCATE ... RESTART IDENTITY` ile deneme verileri birkaç kez temizlendi (başlangıçta tablolar boştu).
- `users` tablosunda deneme kullanıcısı `deneme` var; şu an veritabanında deneme verisi (6 daire) yüklü.

## Found and fixed during implementation

- Küsuratlı kuruş için yanıltıcı "Tutar girilmeli." mesajı → ayrı mesaj.
- Zod'un teknik Türkçe mesajları ("beklenen string, alınan undefined") → "Bu alan zorunlu." / "Sayı olmalı."
- `create-admin` girdisi yönlendirmeyle verilince satırlar kayboluyordu → tamponlu satır okuyucu.
- `Segmented` bileşeninde tip çıkarımı `string`'e genişliyordu → `NoInfer`.
