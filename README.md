# Acar Apartmanı: Yönetim Sistemi

Apartman yöneticisinin telefondan kullandığı web uygulaması: daireler, sakinler, aidat
borçları, tahsilatlar, giderler ve kasa.

## Klasör yapısı

```text
docker-compose.yml        PostgreSQL veritabanı
.env                      Gizli ayarlar (git'e girmez; örneği .env.example)
server/                   API (Node.js + Express + Drizzle ORM)
  drizzle/                Veritabanı migration dosyaları (otomatik üretilir)
  src/
    index.ts              Giriş noktası (Vercel için dışa aktarır, yerelde sunucuyu başlatır)
    create-app.ts         Her şeyin birbirine bağlandığı yer
    config/env.ts         .env okuma ve doğrulama
    db/                   Veritabanı bağlantısı ve tablo tanımları (schema.ts)
    domain/ledger.ts      Borç/ödeme hesabı (saf iş mantığı)
    middleware/           Oturum kontrolü, hata yakalayıcı
    shared/               Hatalar, tarih, doğrulama yardımcıları
    modules/<alan>/       Her konu kendi klasöründe:
      *.routes.ts           HTTP isteğini karşılar
      *.schemas.ts          Gelen veriyi doğrular
      *.service.ts          İş kuralları
      *.repository.ts       Veritabanı sorguları
    scripts/create-admin.ts  Yönetici hesabı oluşturma
web/                      Arayüz (React + Vite)
  src/
    api/                  Sunucuyla konuşan kod
    auth/                 Giriş durumu
    components/           Ortak parçalar (form alanı, ay seçici…)
    hooks/                Veri yükleme yardımcıları
    lib/                  TL / tarih biçimlendirme
    pages/                Ekranlar
```

## İlk kurulum

Gerekenler: Node.js 24+, Docker Desktop.

```bash
cp .env.example .env            # sonra .env içindeki şifreyi değiştirin
docker compose up -d            # veritabanını başlatır

cd server
npm install
npm run db:migrate              # tabloları oluşturur
npm run admin                   # yönetici kullanıcı adı ve şifresi sorar

cd ../web
npm install
```

## Geliştirirken çalıştırma

İki terminal:

```bash
cd server && npm run dev        # API: http://localhost:3000
cd web && npm run dev           # Arayüz: http://localhost:5173
```

Aynı Wi-Fi'deki telefondan denemek için arayüzü `npm run dev -- --host` ile başlatıp
telefonda `http://<bilgisayarın-IP'si>:5173` adresini açın.

## Yayına alma

Vercel + Neon üzerinde ücretsiz yayın adımları: [DEPLOY.md](DEPLOY.md).

## Tek sunucuda çalıştırma

```bash
cd web && npm run build         # arayüzü web/dist içine derler
cd ../server && npm start       # API + arayüz: http://localhost:3000
```

İnternete açarken: `.env` içinde `NODE_ENV=production` yapın ve sunucuyu HTTPS arkasında
çalıştırın (oturum çerezi üretimde yalnızca HTTPS ile gönderilir). Ters vekil (Nginx,
Caddy) kullanıyorsanız `TRUST_PROXY=true` yapın.

## Sık kullanılan komutlar

| Komut (server klasöründe) | Ne yapar |
|---|---|
| `npm run admin` | Yönetici oluşturur; kullanıcı varsa şifresini değiştirir |
| `npm run admin:prod` | Aynısını canlı veritabanında yapar (`.env.production` gerekir) |
| `npm run backup` / `backup:prod` | Tüm kayıtları `backups/` altına tarihli JSON olarak yazar |
| `npm test` | Birim testleri |
| `npm run typecheck` | Tip kontrolü |
| `npm run db:generate` | `schema.ts` değişince yeni migration üretir |
| `npm run db:migrate` | Migration'ları veritabanına uygular |
| `npm run db:studio` | Veritabanını tarayıcıda görüntüler |

`web` klasöründe: `npm test`, `npm run build`.

## Temel kurallar

- Para her yerde **kuruş** cinsinden tam sayı olarak tutulur (1.250,50 TL = 125050).
- Bakiye saklanmaz; her seferinde borçlar − ödemeler olarak hesaplanır.
- Ödemeler belirli bir aya bağlanmaz; en eski borçtan başlayarak düşülür.
- Bir daireye aynı ay için yalnızca bir aidat yazılabilir (veritabanı kuralı).
- Taşınan sakin silinmez, pasife alınır.
- Kasa = tahsilatlar + kasaya eklenen paralar (kasa devri, diğer gelirler) − giderler.
  Kasa devri yalnızca bir kez girilir.
