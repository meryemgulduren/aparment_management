# Acar Apartmanı: Yayına alma rehberi

Site **Vercel**'de (uygulama), veriler **Neon**'da (PostgreSQL) durur. İkisi de ücretsiz.
Kurulum bir kez yapılır; sonra GitHub'a her gönderilen kod kendiliğinden yayına çıkar.

> **Şifre güvenliği:** Neon'un verdiği veritabanı adresi şifre içerir. Bu adresi sohbete,
> e-postaya veya git'e yazma. Yalnızca iki yere girilir: Vercel ayarları ve bilgisayardaki
> git dışı `.env.production` dosyası.

## 1. GitHub

Kod şu depoda: https://github.com/meryemgulduren/aparment_management (herkese açık).
Git geçmişinde şifre yoktur; yeni bir sır eklememek için `.env` ve `.env.production`
dosyaları git dışında tutulur.

## 2. Neon (veritabanı)

1. https://neon.com → **Sign up** (GitHub ile giriş yapabilirsin).
2. Yeni proje:
   - Project name: `acar-apartmani`
   - Region: **AWS Europe Central 1 (Frankfurt)** (Türkiye'ye ve Vercel fonksiyonuna en yakın)
   - Postgres sürümü: varsayılan
3. Proje panelinde **Connect** düğmesi:
   - **Connection pooling** açık olsun (adreste `-pooler` geçer)
   - Gösterilen adresi kopyala. Şuna benzer:
     `postgresql://kullanici:SIFRE@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Bilgisayarda proje kökünde (`C:\projeler\apartman_management`) `.env.production` adında bir
   dosya oluştur ve içine tek satır yaz:
   ```
   DATABASE_URL=buraya-kopyaladığın-adres
   ```
   Bu dosya git'e girmez (`.gitignore`'da).

## 3. Vercel (site)

1. https://vercel.com → **Sign up** → **Continue with GitHub** → Hobby (ücretsiz) planı.
2. **Add New → Project** → `aparment_management` deposunu seç → **Import**.
   Project Name olarak `acar-apartmani` yaz (site adresi buna göre oluşur).
3. Ayarlar ekranında:
   - **Root Directory:** `Edit` → `server` klasörünü seç (önemli)
   - Framework Preset: Express (otomatik algılanmazsa "Other")
   - Build Command / Output: dokunma (`server/vercel.json` içinde tanımlı)
   - **Environment Variables:**
     | Name | Value | Environment |
     |---|---|---|
     | `DATABASE_URL` | Neon adresi (2.3) | yalnızca **Production** |
     | `NODE_ENV` | `production` | Production |
4. **Deploy**. Derleme sırasında arayüz derlenir ve veritabanı tabloları otomatik oluşturulur.
5. Bittiğinde site `https://acar-apartmani.vercel.app` gibi bir adreste açılır. Adres farklıysa
   Settings → Domains'den `acar-apartmani.vercel.app` olarak değiştirebilirsin.

## 4. İlk yönetici hesabı

Canlı sitede henüz hiç hesap yok. Bilgisayarda (`.env.production` hazırken):

```powershell
cd C:\projeler\apartman_management\server
npm run admin:prod
```

Kullanıcı adı ve şifre sorar (şifre ekranda görünmez, en az 10 karakter). Bu hesapla
siteye giriş yapılır. Şifreyi unutursan aynı komut, aynı kullanıcı adıyla şifreyi yeniler.

## 5. Yedek

Ayda bir (ve büyük değişikliklerden önce):

```powershell
cd C:\projeler\apartman_management\server
npm run backup:prod
```

`backups/` klasörüne tarihli bir JSON dosyası yazılır. Bu klasörü ayrıca bir yere
(Google Drive, USB) kopyala. Dosyada sakinlerin adı ve telefonu var; paylaşma.

## Sonradan

- **Telefona uygulama gibi eklemek:** siteyi telefonda aç → Paylaş / menü → **Ana ekrana ekle**.
- **Kod değişiklikleri:** GitHub'daki `main` dalına gönderilen her değişiklik birkaç dakika
  içinde yayına çıkar. Vercel → Deployments'tan önceki sürüme tek tıkla dönülebilir.
- **Özel alan adı** (ör. `acarapartmani.com`): satın alındıktan sonra Vercel → Settings →
  Domains'den eklenir.

## Sorun çıkarsa

| Belirti | Bakılacak yer |
|---|---|
| Derleme hatası | Vercel → Deployments → ilgili derleme → Build Logs |
| Site açılıyor ama giriş "Beklenmeyen hata" | Vercel → Logs; çoğunlukla `DATABASE_URL` yanlış/eksik |
| `npm run admin:prod` bağlanamıyor | `.env.production` dosyası proje kökünde mi, adres tam mı |
| Çok fazla hatalı giriş, 15 dk kilit | Beklemek yeterli; kilit IP bazlı |
