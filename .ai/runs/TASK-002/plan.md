# TASK-002 — Plan

## Summary

Backend'i modüllere ayrılmış, katmanlı bir API'ye dönüştür; yanına React + Vite ile telefon öncelikli arayüz ekle.

## Architecture

```text
server/src/
  app.ts                 Express uygulamasını kurar (composition root: bağımlılıklar burada bağlanır)
  index.ts               Sunucuyu başlatır, kapanışta bağlantıları kapatır
  config/env.ts          Ortam değişkenleri (Zod)
  db/                    Bağlantı + şema
  shared/                Modüllerden bağımsız yardımcılar (hatalar, para, tarih, doğrulama)
  middleware/            Kimlik kontrolü, hata yakalayıcı, giriş deneme sınırı
  modules/<alan>/
    *.routes.ts          HTTP: isteği doğrula, servisi çağır, yanıt dön
    *.service.ts         İş kuralları; veritabanını bilmez, repository arayüzüne bağımlı
    *.repository.ts      Drizzle sorguları
    *.schemas.ts         Zod giriş şemaları
  scripts/create-admin.ts
web/src/
  api/                   fetch istemcisi + uç nokta fonksiyonları
  components/            Ortak arayüz parçaları
  pages/                 Ekranlar
  lib/                   Para / tarih biçimlendirme
```

SOLID karşılığı: her katmanın tek sorumluluğu var (S); servisler somut veritabanına değil repository arayüzüne bağımlı, bağlama `app.ts`'te yapılır (D); bu sayede servisler sahte repository ile test edilir.

## Security

- Şifre: Node `crypto.scrypt` + rastgele salt, `timingSafeEqual` ile karşılaştırma (ek paket yok)
- Oturum: 32 byte rastgele belirteç; çerezde düz, veritabanında SHA-256 hash; `HttpOnly`, `SameSite=Lax`, üretimde `Secure`; 30 gün
- Giriş: IP başına 15 dakikada 10 deneme; kullanıcı yoksa da aynı hata mesajı
- `helmet` güvenlik başlıkları, JSON gövde sınırı (100 kb)
- Tüm girdiler Zod ile doğrulanır; tüm sorgular Drizzle parametreleriyle (SQL injection yok)
- Hata yanıtları iç ayrıntı sızdırmaz

## Schema changes (migration 0001)

- `apartments`: `household_size` (≥ 0), `note`
- `residents`: `note`
- yeni `expenses`: kategori enum, `amount_kurus` > 0, `spent_at`, `description`
- yeni `users`: `username` benzersiz, `password_hash`
- yeni `sessions`: `token_hash` PK, `user_id` (cascade), `expires_at`

## API

| Method | Path | Not |
|---|---|---|
| POST | /api/auth/login, /api/auth/logout | |
| GET | /api/auth/me | |
| GET/POST | /api/apartments | liste bakiye + aktif sakin sayısıyla |
| GET/PATCH/DELETE | /api/apartments/:id | silme yalnızca kayıt yoksa |
| GET | /api/apartments/:id/statement | borçlar (ödeme durumu), ödemeler, bakiye |
| POST | /api/apartments/:id/residents | |
| PATCH | /api/residents/:id | pasife alma dahil |
| POST | /api/charges/bulk | tüm dairelere; aidatta mevcutları atlar |
| POST | /api/charges | tek daire |
| DELETE | /api/charges/:id | |
| GET | /api/charges/last-dues-amount | form önerisi |
| GET/POST | /api/payments, DELETE /api/payments/:id | |
| GET/POST | /api/expenses, DELETE /api/expenses/:id | |
| GET | /api/reports/summary | |

## Verification plan

- `npx tsc --noEmit` (server, web), `npx vitest run`, `npm run build` (web)
- Migration üret + uygula
- Uçtan uca curl: girişsiz 401, giriş, daire + sakin, toplu aidat (2 kez), ödeme, döküm, özet, gider, hatalı girdi 400, çok deneme 429
- Telefon genişliğinde arayüz kontrolü (Vite dev + tarayıcı veya derleme)

## Risks

| Risk | Mitigation |
|---|---|
| Kapsam büyük | Katmanlar tekrar eden kalıpla yazılır; her modül aynı yapıda |
| Toplu borçlandırmada yarış / çift kayıt | Veritabanı benzersiz indeksi + `onConflictDoNothing`, tek transaction |
| Para yuvarlama | Her yerde kuruş tam sayı; TL → kuruş dönüşümü tek fonksiyonda, testli |
