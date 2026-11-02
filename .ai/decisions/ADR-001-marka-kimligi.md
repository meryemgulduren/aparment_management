# ADR-001 — Marka kimliği: renk paleti ve yazı tipleri

## Context

İlk arayüz (koyu mavi bant, sistem yazı tipi) ve sonraki ara denemeler (Inter, koyu lacivert yan menü, mor tonlar) sahibine "kurumsal ve premium" gelmedi. Sahip, beğendiği altı paleti gönderdi ve sitenin hem masaüstünde hem telefonda gerçek, premium bir site gibi durmasını istedi. Karşılaştırma sayfası: `.ai/brand/marka-kiti.html` (https://claude.ai/artifact/PApRkuXtE4TFFYEEfXS5aF).

## Decision

- **Palet A:** Royal Blue `#20309A` (ana renk), Pure White `#FFFFFF` (yüzeyler), Tomato Red `#BB232B` (yalnızca borç / uyarı / tehlikeli işlem).
- **Yazı tipleri (eşleşme 2):** başlıklar ve büyük tutarlar Fraunces; metin, form ve tablolar Plus Jakarta Sans. İkisi de pakete gömülü (`@fontsource-variable/*`), dışarıya istek yok.
- Açık tema; koyu tema ve koyu yan menü yok.
- Durum renkleri: ödendi yeşil `#1D7A4C`, kısmen amber `#A8641A`, ödenmedi Tomato Red.

## Alternatives considered

- B (Ice Silver / Deep Aubergine / Marigold): en özgün ama ana renk koyu; marigold "kısmen" rengiyle çakışıyor.
- C (Glacier / Ultraviolet / Mineral Grey): en ferah ama kurumsal değil, eski mor denemeye çok yakın.
- Elenenler: neon (Cobalt + Lime), koyu kömür + mercan, mocha + lavanta.
- Yazı tipi eşleşmesi 1 (Instrument Serif + Manrope) önerilmişti; sahip daha sıcak olan 2'yi seçti.

## Consequences

- Kırmızı hiçbir yerde süs olarak kullanılmaz; kırmızı görülen yer ilgilenilmesi gereken yerdir.
- Tüm renkler, yazı ölçüleri ve köşe/gölge değerleri `web/src/styles.css` başındaki değişkenlerden gelir; yeni ekranlar bunları kullanır.
- Inter paketi kaldırıldı.

## Owner and date

- Meryem Gulduren, 2026-11-02
