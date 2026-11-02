# TASK-003 — Brief

## Owner

- Human owner: Meryem Gulduren
- Date: 2026-11-02

## Goal

Arayüzü seçilen marka kimliğiyle (ADR-001) baştan uca yeniden tasarlamak: premium, kurumsal, açık; masaüstünde ve telefonda gerçek bir site gibi.

## Scope

### In scope

- Tasarım değişkenleri (renk, yazı ölçeği, boşluk, köşe, gölge) ve tüm stil dosyası
- Uygulama iskeleti: masaüstünde açık renkli yan menü, telefonda alt menü
- Tüm sayfalar: giriş, özet, daireler (liste, detay, formlar), aidat, borçlandırma, tahsilat, giderler, kasa
- Masaüstünde geniş ekranı kullanan düzenler (ızgara, iki sütun); telefonda tek sütun
- Logo ve uygulama ikonu

### Out of scope

- Backend ve API değişikliği
- Yeni özellik

## Acceptance criteria

- [ ] Yalnızca ADR-001 renkleri ve yazı tipleri kullanılıyor; kırmızı yalnızca borç/uyarı/silme
- [ ] Koyu tema veya koyu yan menü yok
- [ ] 390px ve 1280px genişlikte her sayfada yatay kaydırma yok, konsol hatası yok
- [ ] Türkçe karakterler iki yazı tipinde de doğru
- [ ] `npm run build` ve web testleri hatasız
- [ ] Mevcut işlevler (form gönderme, silme, ay değiştirme) bozulmadı
