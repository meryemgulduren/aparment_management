# TASK-001 — Brief

## Owner

- Human owner: Meryem Gulduren
- Date: 2026-10-10

## Goal

Backend'in veritabanı temeli hazır olsun: ayarlar `.env` üzerinden okunuyor, Express sunucusu Drizzle ile PostgreSQL'e bağlanıyor ve ilk tablolar (daireler, sakinler, borçlar, ödemeler) migration ile oluşturulmuş durumda.

## Scope

### In scope

- Veritabanı şifresini `docker-compose.yml` içinden `.env` dosyasına taşımak, `.env.example` eklemek
- `server/tsconfig.json` içinde modül çözümlemesini Node'a uygun hale getirmek
- Drizzle ORM + `pg` sürücüsü + drizzle-kit + Zod kurulumu
- Ortam değişkenlerini Zod ile doğrulayan ayar modülü
- İlk şema: `apartments`, `residents`, `charges`, `payments`
- İlk migration'ın üretilip yerel veritabanına uygulanması
- Veritabanına gerçekten bağlanıldığını gösteren `/health` endpoint'i

### Out of scope

- Giriş / yetkilendirme
- CRUD endpoint'leri (daire ekleme, tahsilat girme vb.)
- Aidat tutarı ayarı ve toplu borçlandırma
- Frontend
- Gider, kasa, duyuru, gecikme tazminatı
- Yayına alma (deploy)

## Acceptance criteria

- [ ] `docker-compose.yml` içinde açık yazılmış şifre yok; `.env` git tarafından izlenmiyor, `.env.example` izleniyor
- [ ] `npm run db:generate` ve `npm run db:migrate` hatasız çalışıyor
- [ ] Veritabanında dört tablo var; para alanları kuruş cinsinden tam sayı
- [ ] Aynı daireye aynı dönem için ikinci kez aidat borcu yazılamıyor (veritabanı kısıtı)
- [ ] `GET /health` veritabanı ayaktayken 200, değilken 503 dönüyor
- [ ] `npx tsc --noEmit` hatasız

## Constraints and assumptions

- Aidat tüm daireler için aynı tutar.
- Daire ve kat sayısı bilinmiyor; daireler yönetici tarafından elle girilecek, şema sabit bir sayı varsaymıyor.
- İlk sürümde yalnızca yönetici giriş yapacak; şema ileride sakin girişine engel olmamalı.
- Kullanım ağırlıklı telefondan (frontend görevlerini etkiler, bu görevi değil).
- Borç kişiye değil daireye yazılır; sakin değişse de dairenin geçmişi kalır.
- Bakiye saklanmaz; borç ve ödeme kayıtlarından hesaplanır.
- Öğrenme amaçlı proje: her adım açıklanarak, küçük parçalar halinde ilerlenir.

## Relevant files or systems

- `docker-compose.yml`, `.gitignore`
- `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`
- Yerel Docker PostgreSQL 16 (127.0.0.1:5433)

## Initial risks and questions

- Mevcut şifre git geçmişinde duruyor (yalnızca yerel, 127.0.0.1'e bağlı veritabanı).
- `server/src/` ve `server/tsconfig.json` henüz commit'lenmemiş.
