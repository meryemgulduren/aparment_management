# TASK-002 — Brief

## Owner

- Human owner: Meryem Gulduren
- Date: 2026-10-16

## Goal

1. aşama: yöneticinin (sahibin babası) telefondan kullanacağı çalışan sistem. Daireleri, sakinleri, aidat borçlarını, tahsilatları, giderleri ve kasayı takip edebilsin.

## Scope

### In scope

- Yönetici girişi (kullanıcı adı + şifre, oturum çerezi), yönetici oluşturma komutu
- Daireler: ekle / düzenle / sil (kaydı yoksa), kat, oturan kişi sayısı, not
- Sakinler: ev sahibi / kiracı ekle, düzenle, pasife al
- Borçlandırma: tüm dairelere toplu aidat veya ek borç; tek daireye borç; borç silme
- Tahsilat: ödeme gir, sil; ödemeler eski borçtan başlayarak kapatılır (hangi ay ödendi görünür)
- Giderler: kategori, tutar, tarih, açıklama; sil
- Raporlar: özet (kasa, toplam alacak, bu ay tahsilat/gider), borçlular, daire hesap dökümü
- Telefon öncelikli web arayüzü (`web/`)
- İş mantığı için birim testleri

### Out of scope

- Sakin girişi, duyurular, WhatsApp/SMS, makbuz, gecikme tazminatı, arıza bildirimi (2. aşama)
- Yayına alma (deploy)

## Acceptance criteria

- [ ] Giriş yapılmadan hiçbir `/api` verisine ulaşılamıyor (401)
- [ ] Şifre düz metin saklanmıyor; oturum belirteci veritabanında hash olarak tutuluyor; çerez `HttpOnly`
- [ ] Giriş denemeleri sınırlandırılmış
- [ ] Toplu aidat aynı ay için ikinci kez çalıştırılınca mevcut daireleri atlıyor, çift borç yazmıyor
- [ ] Daire bakiyesi = borçlar − ödemeler; borçlular listesi doğru
- [ ] Daire dökümünde her borcun ödendi / kısmen / ödenmedi durumu görünüyor
- [ ] Kasa = toplam tahsilat − toplam gider
- [ ] Arayüz 360px genişlikte yatay kaydırma olmadan kullanılabiliyor
- [ ] `tsc` (server + web), birim testleri ve `vite build` hatasız

## Constraints and assumptions

- Para kuruş cinsinden tam sayı; arayüz TL gösterir.
- Aidat tutarı ayrı ayarda saklanmaz; toplu borçlandırmada girilir, form son kullanılan tutarı önerir.
- Tek yönetici kullanıcısı yeterli; şema birden fazlasına izin verir.
- Kasa devri (sistem öncesi kasadaki para) bu görevde yok; açık soru.
