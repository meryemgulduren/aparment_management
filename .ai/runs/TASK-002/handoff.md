# TASK-002 — Handoff

## Status

`verified` — sahibin incelemesi ve commit bekleniyor.

## Goal

1. aşama: yöneticinin telefondan kullandığı çalışan sistem (daireler, sakinler, aidat, tahsilat, gider, kasa, giriş).

## Decisions made

- Katmanlı modül yapısı (routes → service → repository); servisler repository arayüzüne bağımlı, bağlama `server/src/app.ts`'te.
- Oturum: sunucu tarafı oturum tablosu + HttpOnly çerez (JWT değil); belirteç veritabanında SHA-256.
- Şifre: Node yerleşik `scrypt` (ek paket yok).
- Ödemeler aya bağlanmaz, en eski borçtan düşülür (`domain/ledger.ts`).
- Aidat tutarı ayarda saklanmaz; form son aidatı önerir.
- Arayüz ayrı `web/` paketinde; üretimde Express `web/dist`'i aynı adresten sunar (CORS yok).
- Kayıt ol sayfası yok; hesap yalnızca `npm run admin` ile açılır.

- Kasa devri ve diğer gelirler `incomes` tablosunda; kasa devri tek kayıt (düzeltmek için sil + yeniden gir). Kasa sayfası özet kartından açılır (alt menüde yer yok).

## Changed files

`changes.md` dosyasına bakın.

## Evidence

`verification.md` dosyasına bakın.

## Red-team findings

`redteam-review.md` dosyasına bakın. Açık kalan: silinen ödeme/borç için iz kaydı yok (ertelendi).

## Unresolved questions and risks

- Sistemden önceki eski borçlar: "Ek ödeme" olarak "Devreden borç" açıklamasıyla girilebilir; ayrı bir tür istenir mi?
- Yerel veritabanında deneme verisi ve `deneme` kullanıcısı var; gerçek kullanımdan önce silinmeli.

## Next action

- Sahip: arayüzü gözden geçir, commit at.
- Gerçek kullanım öncesi: deneme verisini temizle, `npm run admin` ile gerçek hesabı aç.
- 2. aşama adayları: yayına alma (deploy), işlem geçmişi, sakin girişi, duyurular, WhatsApp hatırlatma, makbuz, gecikme tazminatı.
