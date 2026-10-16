# TASK-002 — Verification

## Environment

- Branch: `task-002-asama-1` (TASK-001 commit `256bcd1` üzerine)
- Windows 11, Node 24.11, PostgreSQL 16 (Docker, 127.0.0.1:5433), TypeScript 7.0.2

## Checks

| Command | Exit code | Result | Notes |
|---|---:|---|---|
| `server: npx tsc --noEmit` | 0 | geçti | Hatalı dosyayla denenip tsc'nin gerçekten hata yakaladığı doğrulandı |
| `server: npx vitest run` | 0 | 6 dosya, 40 test geçti | ledger, dates, validation, auth, login-limiter, charge service |
| `web: npm run build` (tsc + vite build) | 0 | geçti | 295 kB JS (92 kB gzip) |
| `web: npx vitest run` | 0 | 2 dosya, 22 test geçti | TL ayrıştırma, tarih |
| `npm run db:generate` / `db:migrate` | 0 | `0001_asama1.sql` uygulandı | Yalnızca ekleme |
| `npm run admin` (3 senaryo) | 0 / 1 / 1 | oluşturma; kısa şifre ve uyuşmayan şifre reddedildi | Hash `scrypt$...` biçiminde |
| Uçtan uca curl betiği | — | beklenen tüm kodlar | Aşağıda |
| Edge headless, 360px ve 390px, açık/karanlık | — | 10 ekranda yatay kaydırma yok, konsol hatası yok | Ekran görüntüleri incelendi |
| `curl -I /` | — | `upgrade-insecure-requests` ve HSTS yok (geliştirme) | P1 düzeltmesi |
| `curl http://<LAN-IP>:3000/health` | — | 200 | Telefondan erişim |

Uçtan uca sonuçlar: girişsiz 401; yanlış şifre 401; bozuk JSON 400; giriş 200 + `HttpOnly` çerez;
aynı kapı no 409; geçersiz alanlar 400 + alan mesajları; gövdedeki `id` yok sayıldı; toplu aidat
4 oluşturdu, tekrarında 0 oluşturup 4 atladı; tek daireye çift aidat 409; ek ödeme açıklamasız 400;
ileri tarihli ödeme 400; küsuratlı kuruş 400; kayıtlı daire silme 409, boş daire silme 204;
çıkış sonrası 401; 10 hatalı girişten sonra 429; Türkçe karakterler UTF-8 doğru saklandı.
Rakam kontrolü (deneme verisi): kasa 19.150 − 4.570,50 = 14.579,50 TL; toplam alacak 10.250 TL; döküm ve aidat durumları elle hesapla aynı.

## Ek: Kasaya para ekleme

| Check | Result |
|---|---|
| `server: tsc` / `vitest` | exit 0; 7 dosya, 44 test |
| `web: npm run build` / `vitest` | exit 0; 22 test |
| `db:migrate` (`0002_kasa`) | uygulandı |
| Uçtan uca (`e2e-kasa.mjs`) | girişsiz 401; devir 201; ikinci devir 409; açıklamasız gelir 400; ileri tarih 400; kasa 14.579,50 → 40.079,50 TL (beklenen); devir silinip yeniden girildi |
| Edge 360px | 12 ekranda yatay kaydırma yok, konsol hatası yok |

## Red-team disposition

- P1, P2 (ay parametresi), P3 (statik 404) düzeltildi; P2 (silme izi) ertelendi; diğer P3'ler kabul edildi. Ayrıntı: `redteam-review.md`.

## Gaps

- Repository'ler için otomatik entegrasyon testi yok.
- Gerçek telefonda (özellikle iOS Safari) deneme yapılmadı.
