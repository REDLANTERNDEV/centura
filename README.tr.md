# Centura

Küçük ve orta ölçekli işletmeler için kendi sunucunuzda barındırabileceğiniz, çok kiracılı (multi-tenant) CRM. Müşteri kayıtlarını, siparişleri, ürün stoklarını ve satış analitiğini tek bir uygulamadan yönetin.

[![Lisans: AGPL v3](https://img.shields.io/badge/lisans-AGPL--3.0-blue.svg)](./LICENSE)

**English:** [README.md](./README.md)

---

## Ekran Görüntüleri

| Kontrol paneli                                         | Satış analitiği                                               |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| ![Kontrol paneli](./docs/screenshots/01-dashboard.png) | ![Satış analitiği](./docs/screenshots/02-sales-analytics.png) |

| Müşteriler                                         | Ürünler ve stok                                 |
| -------------------------------------------------- | ----------------------------------------------- |
| ![Müşteriler](./docs/screenshots/03-customers.png) | ![Ürünler](./docs/screenshots/04-inventory.png) |

---

## Özellikler

### Müşteriler

İletişim bilgileri, fatura ve teslimat adresleri, vergi numarası ve vergi dairesi,
segment ve müşteri tipi, kredi limiti, ödeme vadesi, atanmış temsilci ve serbest
metin notları ile müşteri kayıtları.

### Siparişler

Uçtan uca sipariş yaşam döngüsü — `draft` → `confirmed` → `processing` → `shipped`
→ `delivered`; `cancelled` her aşamada kullanılabilir. Her sipariş; kalem satırları,
sipariş ve satır bazlı indirimler, vergi, ara toplam ve genel toplam, ayrı teslimat
ve fatura adresleri ile tahmini teslim tarihi taşır. Ödeme durumu ayrı olarak
`pending`, `partial`, `paid` veya `refunded` şeklinde izlenir.

### Ürünler ve stok

SKU, barkod, kategori, birim, üç ayrı fiyat alanı (liste, satış, maliyet) ve vergi
oranı ile ürün kataloğu. Stok ürün bazında tutulur; düşük stok eşiği ve yeniden
sipariş noktası tanımlanabilir.

### Analitik

Kontrol paneli ve analitik sayfası üzerinden sunulan, 17 uç noktalı ayrı bir
insights API'si:

- **Müşteriler** — en iyi müşteriler, segmentler, elde tutma (retention),
  kayıp (churn) ve RFM segmentasyonu (recency / frequency / monetary)
- **Gelir** — gelir metrikleri, brüt kâr marjı, aylık büyüme
- **Ödemeler** — ödeme analizi ve ortalama tahsilat süresi (DSO)
- **Siparişler ve ürünler** — sipariş metrikleri, en çok satan ürünler,
  kategori performansı, aylık satışlar
- **Stok** — stok sağlığı ve devir hızı

### Çok kiracılı yapı

Her kayıt bir organizasyona bağlıdır. Kullanıcılar organizasyonlara
`user_organization_roles` üzerinden bağlanır ve beş rol desteklenir:

| Rol         | Kullanım amacı                                        |
| ----------- | ----------------------------------------------------- |
| `org_owner` | Organizasyon üzerinde tam yetki; sahiplik devri dâhil |
| `org_admin` | Yönetici erişimi; kullanıcıları ve ayarları yönetir   |
| `manager`   | Müşteri, sipariş ve ürünlerin günlük yönetimi         |
| `user`      | Standart operasyonel erişim                           |
| `viewer`    | Yalnızca okuma                                        |

Kurulumu işleten taraf için ayrı bir `platform_admin` sistem rolü bulunur. Platform
yöneticileri kiracı verilerini sessizce okuyamaz; erişim, `pending` / `approved` /
`rejected` / `expired` durumları olan `support_access_requests` onay akışından geçer.

### Denetim

İşlemler daha sonra incelenmek üzere `audit_logs` tablosuna yazılır.

---

## Teknoloji altyapısı

**Frontend** — Next.js 16 (App Router, Turbopack), React 19, TypeScript,
Tailwind CSS 4, Radix UI, Recharts, Axios, Zod.

**Backend** — Node.js 20, Express 5, doğrudan `pg` ile erişilen PostgreSQL 16
(ORM kullanılmaz), JWT kimlik doğrulama, Argon2 parola hashleme, Helmet,
`express-rate-limit`, yenileme token temizliği için `node-cron`.

**Altyapı** — Docker ve Docker Compose, npm workspaces, opsiyonel nginx ters vekil
sunucusu, Husky ve lint-staged ile ESLint ve Prettier.

---

## Hızlı başlangıç

Gereksinimler: Docker ve Docker Compose. (Docker'sız kurulum için Node.js 20+ ve
PostgreSQL 16+ gerekir.)

```bash
git clone https://github.com/REDLANTERNDEV/centura.git
cd centura
cp .env.docker.example .env
```

Başlatmadan önce `.env` içinde en az şu değerleri ayarlayın:

| Değişken         | Açıklama                                             |
| ---------------- | ---------------------------------------------------- |
| `DB_PASSWORD`    | Veritabanı parolası. Varsayılanı mutlaka değiştirin. |
| `JWT_SECRET`     | En az 32 rastgele karakter                           |
| `SESSION_SECRET` | En az 32 rastgele karakter                           |

Rastgele bir anahtar üretmek için:

```bash
openssl rand -base64 48
```

Ardından geliştirme ortamını başlatın:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Servis          | Adres                               |
| --------------- | ----------------------------------- |
| Frontend        | http://localhost:4321               |
| Backend API     | http://localhost:8765/api/v1        |
| Sağlık kontrolü | http://localhost:8765/api/v1/health |
| PostgreSQL      | localhost:5432                      |

Veritabanı şeması ilk açılışta `apps/backend/scripts/init-schema.sql` dosyasından
otomatik olarak uygulanır.

### Sık kullanılan komutlar

```bash
# Arka planda başlat
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Logları izle
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Tek bir servisi yeniden başlat
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart backend

# Konteynere kabuk erişimi
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh

# Durdur ve veritabanı dâhil tüm verileri sil
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Docker olmadan

```bash
cp .env.example .env
npm ci

# Terminal 1 — backend: http://localhost:8765
npm run dev:backend

# Terminal 2 — frontend: http://localhost:3000
npm run dev:frontend
```

`.env` içindeki `DB_*` değerlerinden erişilebilen, `init-schema.sql` uygulanmış bir
PostgreSQL 16 örneğine ihtiyacınız olur.

---

## Yayına alma (Deployment)

### Zorunlu yapılandırma

```bash
NEXT_PUBLIC_API_URL=https://alanadiniz.com/api/v1   # tarayıcının çağırdığı adres
CORS_ORIGIN=https://alanadiniz.com
JWT_SECRET=<en az 32 rastgele karakter>
SESSION_SECRET=<en az 32 rastgele karakter>
```

> **`NEXT_PUBLIC_API_URL` derleme sırasında JavaScript paketinin içine gömülür.**
> Değiştirdiğinizde `--build` ile yeniden derlemek gerekir; konteyneri yeniden
> başlatmak yeterli değildir. `docker-compose.prod.yml` kullanıldığında, bu değişken
> tanımlı değilse `localhost`'a bakan bozuk bir paket üretmek yerine derleme bilerek
> hata verir.

### Kendi ters vekil sunucunuzun arkasında

TLS sonlandırmayı Traefik, Caddy, Cloudflare, nginx ya da Dokploy veya Coolify gibi
bir platformla zaten yapıyorsanız dâhili nginx'e ihtiyacınız yoktur. Vekil
sunucunuzu doğrudan frontend ve backend konteynerlerine yönlendirin:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Dâhili nginx ile

nginx servisi `production` profiline aittir ve bu profil etkinleştirilmediği sürece
**başlatılmaz**:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

Her şeyi 80 portunda tek bir origin üzerinden sunar — `/` frontend'e, `/api/...`
backend'e gider. Bu nedenle `NEXT_PUBLIC_API_URL=http://sunucu-adresiniz/api/v1`
şeklinde ayarlayın.

HTTPS isteğe bağlıdır. TLS'i üst kattaki bir vekil yerine bu nginx üzerinde
sonlandırmak için [`nginx/conf.d/tls.conf.example`](./nginx/conf.d/tls.conf.example)
dosyasındaki adımları izleyin.

### Web analitiği (opsiyonel)

Varsayılan olarak kapalıdır — hiçbir ayar yapılmazsa üçüncü taraf bir script
yüklenmez ve dışarıya ziyaretçi verisi gitmez. Hâlihazırda kullandığınız
sağlayıcıyı seçin:

```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=umami   # veya plausible, google, matomo, fathom, custom
NEXT_PUBLIC_ANALYTICS_SITE_ID=00000000-0000-0000-0000-000000000000
NEXT_PUBLIC_ANALYTICS_HOST=https://umami.example.com
```

`SITE_ID` ve `HOST` değerlerinin anlamı sağlayıcıya göre değişir:

| Sağlayıcı   | `SITE_ID`                      | `HOST`                            |
| ----------- | ------------------------------ | --------------------------------- |
| `umami`     | website ID (UUID)              | Umami adresiniz — **zorunlu**     |
| `plausible` | alan adı, ör. `example.com`    | kendi kurulumunuz; bulut için boş |
| `google`    | measurement ID, `G-XXXXXXXXXX` | boş bırakın                       |
| `matomo`    | sayısal site ID                | Matomo adresiniz — **zorunlu**    |
| `fathom`    | site ID                        | boş bırakın veya özel alan adı    |
| `custom`    | kullanılmaz                    | kullanılmaz                       |

Geri kalanı iki opsiyonel değişken karşılar:

- `NEXT_PUBLIC_ANALYTICS_SRC` — `HOST`tan türetilen adresi geçersiz kılan tam
  script URL'i. Proxy'lenmiş veya adı değiştirilmiş scriptler için kullanışlıdır,
  `custom` sağlayıcısı için **zorunludur**.
- `NEXT_PUBLIC_ANALYTICS_ATTRS` — script etiketine eklenecek fazladan
  öznitelikler, JSON nesnesi olarak: `{"data-domains":"example.com"}`.

Bu ikisi sayesinde `custom` genel bir çıkış kapısı olur: düz bir
`<script src=…>` etiketiyle kurulan her araç, kodda değişiklik yapmadan çalışır.

```bash
NEXT_PUBLIC_ANALYTICS_PROVIDER=custom
NEXT_PUBLIC_ANALYTICS_SRC=https://analytics.example.com/tracker.js
NEXT_PUBLIC_ANALYTICS_ATTRS={"data-site":"abc123"}
```

Script kök layout'tan yüklenir; bu nedenle sayfa görüntülemeleri uygulamanın
tamamında sayılır — tanıtım sayfası, giriş ve kayıt sayfaları ve istemci tarafı
gezinmeleri de dâhil olmak üzere dashboard sayfaları. Sayfa görüntülemelerine ek
olarak, başarılı kayıttan sonra tek bir özel `signup` olayı gönderilir. Hiçbir
rota kayıt ID'si taşımaz; müşteri verisi, e-posta adresi veya kayıt ID'si olay
verisi olarak asla gönderilmez.

Oturum açmış kullanıcıların kullanımını ölçmek istemiyorsanız
[`apps/frontend/app/layout.tsx`](./apps/frontend/app/layout.tsx) içindeki
`<AnalyticsScripts />` bileşenini kaldırıp `app/(public)/layout.tsx` içinde
render edin.

> `NEXT_PUBLIC_API_URL` gibi bu değerler de derleme sırasında pakete gömülür —
> değiştirdikten sonra `--build` ile yeniden derleyin. Adı yazılmış ama eksik
> yapılandırılmış bir sağlayıcı (yazım hatası, eksik host) hiçbir şey ölçmeyen
> bir paket üretmek yerine derlemeyi hata ile durdurur.

### Portlar

`BACKEND_PORT` ve `FRONTEND_PORT` yalnızca **host** portunu belirler. Ağ içinde
backend her zaman 8765, frontend her zaman 4321 portunu dinler; böylece nginx
upstream tanımları eşlemeden bağımsız olarak geçerli kalır.

PostgreSQL üretimde bilerek host'a **açılmaz** — backend ona Docker iç ağı üzerinden
erişir. Geliştirme katmanı yerel araçlar için 5432'yi yayınlar. Üretim
veritabanına erişmek için SSH tüneli kullanın:

```bash
ssh -L 5432:localhost:5432 kullanici@sunucunuz
```

---

## Proje yapısı

```
centura/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/        # Veritabanı, çerezler, mesajlar
│   │   │   ├── controllers/   # İstek işleyicileri
│   │   │   ├── middleware/    # Kimlik doğrulama, güvenlik, org bağlamı, hatalar
│   │   │   ├── models/        # Alan bazlı SQL sorguları
│   │   │   ├── routes/        # API uç noktaları
│   │   │   ├── services/      # Zamanlanmış görevler
│   │   │   ├── utils/         # Denetim günlüğü ve yardımcılar
│   │   │   └── validators/    # Girdi doğrulama
│   │   ├── scripts/           # init-schema.sql ve bakım SQL'leri
│   │   └── Dockerfile
│   └── frontend/
│       ├── app/               # Next.js App Router sayfaları
│       ├── components/        # React bileşenleri
│       ├── hooks/             # Özel hook'lar
│       ├── lib/               # API istemcisi ve yardımcılar
│       └── Dockerfile
├── api-tests/                 # Bruno API koleksiyonu
├── docs/                      # Docker rehberleri ve ekran görüntüleri
├── nginx/                     # Ters vekil yapılandırması
├── scripts/                   # Kurulum ve yedekleme betikleri
├── docker-compose.yml         # Temel yapılandırma
├── docker-compose.dev.yml     # Geliştirme katmanı
└── docker-compose.prod.yml    # Üretim katmanı
```

---

## Veritabanı şeması

[`apps/backend/scripts/init-schema.sql`](./apps/backend/scripts/init-schema.sql)
dosyasında tanımlıdır.

| Tablo                     | Amaç                                                   |
| ------------------------- | ------------------------------------------------------ |
| `organizations`           | Kiracılar                                              |
| `users`                   | Kullanıcı hesapları                                    |
| `user_organization_roles` | Organizasyon bazlı üyelik ve rol                       |
| `platform_admins`         | Kurulumu işleten yöneticiler                           |
| `support_access_requests` | Platform yöneticisi erişimi için onay akışı            |
| `refresh_tokens`          | Verilen yenileme token'ları; düzenli olarak temizlenir |
| `customers`               | Müşteri kayıtları                                      |
| `products`                | Katalog, fiyatlandırma ve stok seviyeleri              |
| `orders`                  | Sipariş başlıkları, durum, ödeme ve adresler           |
| `order_items`             | Sipariş kalemleri                                      |
| `audit_logs`              | Kaydedilen işlemler                                    |

---

## Güvenlik

**Kimlik doğrulama** — Çerez olarak iletilen JWT erişim ve yenileme token'ları;
`NODE_ENV=production` iken `secure` etkin, çerez bazlı `sameSite` ayarı ve oturum
çerezlerinde `httpOnly`. Parolalar Argon2 ile hashlenir.

**Yenileme token'ı rotasyonu** — Yenileme token'ları düz metin olarak değil,
hashlenmiş biçimde saklanır ve _token ailesi_ (token family) altında gruplanır. Her
giriş yeni bir aile başlatır; böylece ikinci bir cihazdan giriş yapmak ilk oturumu
etkilemez. Yenileme işlemi, token'ı kendi ailesi içinde döndürür ve bir öncekini
iptal eder — yani tek bir oturum, kullanıcıyı diğer cihazlardan çıkarmadan
geçersiz kılınabilir. Her token, verildiği cihazı ve son kullanım zamanını kaydeder;
süresi dolan kayıtlar `node-cron` ile düzenli olarak temizlenir.

**CSRF** — Durum değiştiren istekler çift gönderimli çerez (double-submit cookie)
yöntemiyle korunur: oturumla birlikte rastgele bir token üretilir ve istemcinin
başlıkta geri gönderebilmesi için bilinçli olarak JavaScript tarafından okunabilir
bırakılır.

**Yetkilendirme** — Beş organizasyon rolü ve ayrı bir platform yöneticisi rolü.
Kiracı verileri `org_id` ile kapsanır ve org bağlam middleware'i tarafından zorunlu
kılınır.

**Aktarım ve başlıklar** — Helmet güvenlik başlıkları, `CORS_ORIGIN` ile yönetilen
CORS izin listesi ve kimlik doğrulama, doğrulama, hassas işlemler, sağlık kontrolü
ve genel trafik için ayrı ayrı uygulanan hız sınırlama.

**Tedarik zinciri** — `.npmrc` şunları zorunlu kılar:

- `min-release-age=7` — son 7 gün içinde yayınlanmış paketler reddedilir; ele
  geçirilmiş sürümlere maruz kalma süresi kısalır
- `ignore-scripts=true` — `postinstall` gibi kurulum betikleri çalıştırılmaz
- `save-exact=true` — bağımlılıklar tam sürüm numarasıyla sabitlenir

Derlemelerde `npm ci` kullanılır; lockfile bağlayıcıdır.

**Güvenlik açığı bildirimi** — lütfen herkese açık issue yerine bir
[güvenlik danışma kaydı](https://github.com/REDLANTERNDEV/centura/security/advisories/new)
açın.

---

## Henüz uygulanmadı

Aşağıdakiler mevcut şemada ve API'de yer almaz. Kapsamın net olması için listelenmiştir:

- Satış pipeline'ı ve fırsat takibi
- Müşteri etkileşim geçmişi (arama, e-posta, görüşme kayıtları)
- Tedarikçi ve satın alma yönetimi
- Düşük stok eşiğinden otomatik yeniden sipariş tetikleme
- **Kullanıcıya açık oturum yönetimi.** Veri katmanı tamamlanmış durumda — aktif
  oturumlar cihaz bazında kaydediliyor ve `getUserActiveSessions` /
  `revokeUserSession` fonksiyonları `userModel.js` içinde mevcut — ancak bunları
  dışa açan bir route henüz yok; dolayısıyla kullanıcılar kendi oturumlarını
  listeleyemiyor veya sonlandıramıyor. Bunu bağlamak küçük ve bağımsız bir katkı
  olur.

---

## Bilinen sorunlar

Bu dokümantasyon geçişi sırasında bulunup koda karşı doğrulanmış, henüz
düzeltilmemiş sorunlar:

- **Analitik gösterge paneli, API başarısız olduğunda sessizce sahte veri
  gösteriyor.** `analytics/page.tsx` içinde, başarısız bir istek mock veriye
  düşüyor ve hata durumunu temizliyor — "for development" yorumuna rağmen
  hiçbir ortam kontrolü yok. Kullanıcı, gerçek olmadığına dair hiçbir işaret
  olmadan tamamen uydurma sayılarla dolu bir gösterge paneli görebilir. Bkz.
  [analytics.md](./docs/guides/analytics.md#kozmetik-olmayan-iki-gerçek-hata).
- **Analitik zaman aralığı seçicisinin hiçbir etkisi yok.** Frontend,
  backend'in hiç okumadığı bir `period` sorgu parametresi gönderiyor. Aynı
  doküman.
- **`unit_price` boş bırakılırsa sipariş oluşturma `NaN` toplamlar
  üretiyor**, önceki dokümanların iddia ettiği gibi ürünün kayıtlı fiyatına
  düşmüyor. Bkz.
  [orders.md](./apps/backend/docs/api/orders.md#bilinen-sorun-unit_price-boş-bırakılırsa-fiyat-otomatik-doldurulmaz).
- **CSRF token'ları üretiliyor ama asla doğrulanmıyor.** `validateCSRFToken`
  mevcut ama hiçbir route'a bağlanmamış; frontend de header'ı göndermiyor.
  Gerçek CSRF koruması yalnızca `sameSite: 'lax'`. Bkz.
  [http-only-cookies.md](./apps/backend/docs/architecture/http-only-cookies.md#bilinen-sorun-csrf-tokenı-üretiliyor-ama-hiçbir-yerde-doğrulanmıyor).
- **İstek bazlı hata ayıklama logları her ortamda, production dâhil,
  koşulsuz çalışıyor** — çoğu kimlik doğrulanmış istekte kullanıcı
  e-postaları, rolleri ve organizasyon ID'leri konteyner loglarına yazılıyor.
  Bkz.
  [security.md](./apps/backend/docs/architecture/security.md#bilinen-sorun-hata-ayıklama-logları).
- **`make install`, macOS/Linux'ta bozuk** — POSIX Makefile hedefinde
  Windows batch sözdizimi kullanılmış. Doğrudan
  `cp .env.docker.example .env` kullanın. Bkz.
  [docs/docker/README.md](./docs/docker/README.md).
- **`DB_NAME` varsayılanları dosyalar arasında tutarsız**
  (`mini_saas_erp` / `centura_crm`) — bu da diğer varsayılanı kullanıyorsanız
  Makefile'ın `db-backup`/`db-restore` hedeflerini bozuyor. Bkz.
  [database.md](./apps/backend/docs/architecture/database.md#veritabanı-adı).

Bu geçiş sırasında bulunup kod içinde zaten düzeltilen iki sorun daha vardı:
`calculate_rfm_scores` veritabanı fonksiyonu tamamen eksikti (RFM uç noktası
500 dönerdi) ve yenileme token'ı doğrulaması, isteği yapan kullanıcının
token'ları yerine sistemdeki tüm kullanıcıların token'larını tarıyordu —
ikisi de yük altında hem bozuk hem yavaştı. Mevcut production
veritabanlarında RFM fonksiyonunun hâlâ elle uygulanması gerekiyor — bkz.
[insights.md](./apps/backend/docs/api/insights.md#bilinen-sorun-çözüldü--sunucunuzda-henüz-uygulanmamış-olabilir).

---

## Katkıda bulunma

Katkılar memnuniyetle karşılanır. Ayrıntılar için
[CONTRIBUTING.md](./.github/CONTRIBUTING.md) dosyasına bakın.

```bash
git checkout -b feature/ozelliginiz
npm run lint
npm run format
git commit -m "feat: değişikliğinizi açıklayın"
```

`main` dalına bir pull request açın. Commit mesajları
[Conventional Commits](https://www.conventionalcommits.org/) biçimini izler.

- **Hatalar:** [issue açın](https://github.com/REDLANTERNDEV/centura/issues/new)
- **Özellikler:** `feature request` etiketiyle issue açın

---

## Dokümantasyon

- [API referansı](./api-tests/README.md)
- [Docker rehberi](./docs/docker/README.md)
- [Üretim kontrol listesi](./docs/docker/PRODUCTION_CHECKLIST.md)

---

## Lisans

[GNU Affero General Public License v3.0](./LICENSE) ile lisanslanmıştır.

Bu yazılımı ticari kullanım dâhil olmak üzere kullanabilir, değiştirebilir ve
dağıtabilirsiniz. Değiştirip ağ üzerinden sunuyorsanız, değiştirdiğiniz kaynak kodu
aynı lisansla yayımlamanız gerekir.
