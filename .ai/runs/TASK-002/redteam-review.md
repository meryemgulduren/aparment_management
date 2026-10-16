# TASK-002 — Red-team review

## Review context

- Reviewer: Claude (aynı oturum; bağımsız ikinci göz değil, sahibin incelemesi önerilir)
- Commit or diff reviewed: `task-002-asama-1` çalışma ağacı

## Findings

### [P1 — HTTP'de CSP `upgrade-insecure-requests` arayüzü bozar]

- Evidence: `helmet()` varsayılanı; ev ağında `http://<IP>:3000` ile açılınca tarayıcı script'leri HTTPS'ten ister.
- Impact: Telefonda denemede boş sayfa.
- Recommendation: Yükseltme ve HSTS yalnızca üretimde.
- Disposition: Düzeltildi (`app.ts`); `curl -I` ile başlıkların yokluğu doğrulandı.

### [P2 — Geçersiz `?ay=` parametresi toplu borçlandırma sayfasını çökertir]

- Evidence: `BulkChargePage` değeri doğrulamadan `formatPeriod`'a veriyordu (`RangeError`).
- Disposition: Düzeltildi (`periodOrCurrent`), birim testi eklendi.

### [P3 — Eksik statik dosya için index.html 200 dönüyordu]

- Disposition: Düzeltildi; uzantılı yollar 404.

### [P2 — Silinen ödeme/borç için iz kaydı yok]

- Impact: Yanlışlıkla silinen ödeme geri getirilemez.
- Mitigation: Her silmede onay penceresi.
- Disposition: Ertelendi (2. aşama: işlem geçmişi / yumuşak silme).

### [P3 — Giriş sınırı bellekte ve IP bazlı]

- Impact: Sunucu yeniden başlayınca sıfırlanır; vekil arkasında `TRUST_PROXY` ayarlanmazsa tüm kullanıcılar tek IP sayılır.
- Disposition: Kabul edildi; tek sunuculu küçük kurulum için yeterli, README'de belirtildi.

### [P3 — "Toplam alacak" vadesi gelmemiş borçları da içerir]

- Disposition: Kabul edildi; ileri tarihli aidat yazılırsa özet bunu borç sayar.

## Surfaces reviewed

- [x] Acceptance criteria
- [x] Error and edge paths (geçersiz id, bozuk JSON, büyük gövde, çift aidat, ileri tarih, küsurat)
- [x] Security and data handling (şifre hash, belirteç hash, HttpOnly/SameSite çerez, CSRF, toplu atama, SQL injection, açık yönlendirme `geri=`, hata mesajı sızıntısı, kaba kuvvet)
- [x] Compatibility and existing contracts (`/health` korunuyor; migration yalnızca ekleme)
- [x] Test quality (iş mantığı birim testli; repository'ler yalnızca uçtan uca elle denendi)
- [x] Scope and maintainability

## Residual uncertainty

- Repository katmanı için otomatik entegrasyon testi yok.
- iOS Safari'de gerçek cihaz denemesi yapılmadı (Edge mobil emülasyonu kullanıldı).
