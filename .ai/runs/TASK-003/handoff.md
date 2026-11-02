# TASK-003 — Handoff

## Status

`verified` — sahibin incelemesi ve commit bekleniyor. Branch: `task-003-marka-tasarim`.

## Goal

Arayüzü ADR-001 marka kimliğiyle (Royal Blue / Pure White / Tomato Red, Fraunces + Plus Jakarta Sans) baştan uca yeniden tasarlamak.

## Decisions made

- Marka: `.ai/decisions/ADR-001-marka-kimligi.md`. Karşılaştırma sayfası: `.ai/brand/marka-kiti.html`.
- Masaüstü (≥1024px): beyaz yan menü + üst bar; telefon: üst bar + 5 sekmeli alt menü. Kasa yalnızca masaüstü menüsünde ve özet kartında (alt menüde yer yok).
- Başlıklar, büyük tutarlar ve kapı numarası rozetleri Fraunces; geri kalan Plus Jakarta Sans.
- Kırmızı yalnızca borç, uyarı ve silme.
- İkonlar tek dosyada (`components/Icon.tsx`); metin işaretleri (✕, ‹) kaldırıldı.
- Formlarda telefonda asıl işlem üstte, masaüstünde sağda.

## Changed files

- `web/src/styles.css` (yeniden yazıldı), `web/src/main.tsx` (yazı tipleri)
- `web/src/components/`: `Icon.tsx` (yeni), `Layout.tsx`, `PageHeader.tsx` (`eyebrow`, `description`, `actions`), `MonthSwitcher.tsx`, `ChargeForm.tsx`
- Tüm sayfalar: `LoginPage`, `DashboardPage`, `apartments/*`, `dues/*`, `payments/*`, `expenses/*`, `cash/*`
- `web/public/icon.svg`, `web/public/manifest.webmanifest`, `web/index.html`
- `web/package.json`: `@fontsource-variable/inter` çıkarıldı; `fraunces` ve `plus-jakarta-sans` eklendi
- `docker-compose.yml`: DB portu `POSTGRES_PORT` ile değiştirilebilir (varsayılan 5433)
- `.ai/decisions/ADR-001-marka-kimligi.md`, `.ai/brand/marka-kiti.html`, `.ai/runs/TASK-003/`

## Evidence

| Kontrol | Sonuç |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run build` | exit 0; Fraunces ve Plus Jakarta Sans `latin-ext` dosyaları pakette |
| `npx vitest run` | 22/22 |
| Edge, 1280px ve 390px, 11 sayfa + giriş | 24 görüntüde yatay kaydırma yok, konsol hatası yok; görüntüler incelendi |
| Arayüzden ödeme girme (390px) | "12,34" → 1234 kuruş kaydedildi, bakiye doğru düştü; hatalı tutar uyarısı çıktı; deneme kaydı silindi |

## Red-team findings

- Görsel incelemede bulunup düzeltilenler: özet kutusunda tutar renginin ezilmesi, "Borcun tamamı" düğmesinin yerinin kayması, telefonda düğme sırası.
- Kabul edilen: masaüstü üst barındaki sayfa adı ile sayfa başlığı bazı sayfalarda aynı ("Kasa"); bağlam için bırakıldı.

## Unresolved questions and risks

- Gerçek iPhone/Safari'de denenmedi (Edge mobil emülasyonu).
- Yerel ortamda `rezervation_postgres` 5433'ü kullandığı için DB bu oturumda 5437'de çalıştı; kalıcı çözüm için `.env`'de `POSTGRES_PORT` ve `DATABASE_URL` portu güncellenmeli ya da diğer konteyner kapatılmalı.
- TASK-002 sonrası commit'lenmemiş arayüz denemeleri (Inter, koyu yan menü) bu görevle değiştirildi.

## Next action

- Sahip: http://localhost:5173 üzerinden telefonda ve bilgisayarda gözden geçir; uygunsa commit.
