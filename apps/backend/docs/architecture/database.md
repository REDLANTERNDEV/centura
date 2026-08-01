# Veritabanı Şeması

Centura, PostgreSQL 16 üzerinde çalışır ve veritabanına ORM olmadan, doğrudan `pg`
sürücüsüyle erişir.

> **Tek doğru kaynak:** [`apps/backend/scripts/init-schema.sql`](../../scripts/init-schema.sql).
> Bu doküman şemayı açıklar, onun yerine geçmez. Bir uyuşmazlık görürseniz SQL
> dosyası geçerlidir. Şema, PostgreSQL konteyneri ilk kez ayağa kalktığında
> `/docker-entrypoint-initdb.d` üzerinden otomatik olarak uygulanır.

Toplamda 11 tablo, 8 trigger, 3 fonksiyon, 1 view ve 59 indeks bulunur.
`uuid-ossp` eklentisi kullanılır.

## Veritabanı adı

Veritabanı adı `DB_NAME` ile belirlenir. Depoda iki farklı varsayılan bulunduğunu
bilin — bağlanırken kendi `.env` dosyanızdaki değeri esas alın:

| Kaynak                            | Değer           |
| --------------------------------- | --------------- |
| `docker-compose.yml` (varsayılan) | `mini_saas_erp` |
| `.env.docker.example`             | `centura_crm`   |

## Tablo grupları

| Grup             | Tablolar                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Kimlik ve erişim | `organizations`, `users`, `user_organization_roles`, `platform_admins`, `support_access_requests`, `refresh_tokens` |
| İş verisi        | `customers`, `products`, `orders`, `order_items`                                                                    |
| Denetim          | `audit_logs`                                                                                                        |

---

## Kimlik ve erişim

### organizations

Kiracı (tenant) kaydı. Sistemdeki neredeyse her tablo `org_id` ile buraya bağlanır.

| Sütun                                                                    | Tip          | Açıklama                                                               |
| ------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------------- |
| `org_id`                                                                 | SERIAL PK    | Dahili birincil anahtar                                                |
| `org_uuid`                                                               | UUID         | Dışa açık tanımlayıcı — bkz. [org_uuid kullanımı](#org_uuid-kullanımı) |
| `org_name`                                                               | VARCHAR(255) | Zorunlu                                                                |
| `industry`, `phone`, `email`, `address`, `city`, `country`, `tax_number` | —            | Profil alanları                                                        |
| `is_active`                                                              | BOOLEAN      | Varsayılan `TRUE`                                                      |
| `created_at`, `updated_at`                                               | TIMESTAMPTZ  | `updated_at` trigger ile güncellenir                                   |

### users

Kullanıcı hesapları. Parolalar `password_hash` içinde Argon2 ile saklanır; düz metin
parola hiçbir yerde tutulmaz.

| Sütun           | Tip                 | Açıklama                                         |
| --------------- | ------------------- | ------------------------------------------------ |
| `id`            | SERIAL PK           |                                                  |
| `org_id`        | INTEGER FK          | Kullanıcının birincil organizasyonu              |
| `email`         | VARCHAR(255) UNIQUE | Sistem genelinde benzersiz                       |
| `password_hash` | TEXT                | Argon2                                           |
| `name`          | VARCHAR(255)        |                                                  |
| `system_role`   | VARCHAR(50)         | Yalnızca `'platform_admin'` veya `NULL` olabilir |
| `is_active`     | BOOLEAN             |                                                  |

Bir kullanıcının organizasyon içindeki yetkisi bu tabloda değil,
`user_organization_roles` içinde tutulur.

### user_organization_roles

Kullanıcı ile organizasyon arasındaki üyelik ve rol bağı. Bir kullanıcı birden fazla
organizasyona farklı rollerle üye olabilir.

| Sütun                        | Tip         | Açıklama                                              |
| ---------------------------- | ----------- | ----------------------------------------------------- |
| `user_id`, `org_id`          | INTEGER FK  | Üyelik çifti                                          |
| `role`                       | VARCHAR(50) | `org_owner`, `org_admin`, `manager`, `user`, `viewer` |
| `permissions`                | JSONB       | Rol üzerine ek/ince ayar izinler                      |
| `is_active`                  | BOOLEAN     | Üyeliği silmeden askıya almak için                    |
| `assigned_by`, `assigned_at` | —           | Yetkiyi kimin ne zaman verdiği                        |

Roller en geniş yetkiden en dara doğru:

| Rol         | Kapsam                                                |
| ----------- | ----------------------------------------------------- |
| `org_owner` | Organizasyon üzerinde tam yetki; sahiplik devri dâhil |
| `org_admin` | Kullanıcı ve ayar yönetimi                            |
| `manager`   | Müşteri, sipariş ve ürünlerin günlük yönetimi         |
| `user`      | Standart operasyonel erişim                           |
| `viewer`    | Yalnızca okuma                                        |

### platform_admins

Kurulumu işleten taraf (kiracılar değil) için ayrı yetki tablosu.

| Sütun                                                            | Tip         | Açıklama                                   |
| ---------------------------------------------------------------- | ----------- | ------------------------------------------ |
| `user_id`                                                        | INTEGER FK  |                                            |
| `admin_level`                                                    | VARCHAR(50) | `senior`, `junior`, `readonly`             |
| `permissions`                                                    | JSONB       |                                            |
| `can_access_user_data`                                           | BOOLEAN     | **`CHECK (can_access_user_data = FALSE)`** |
| `assigned_by`, `assigned_at`, `revoked_at`, `is_active`, `notes` | —           | Yetki yaşam döngüsü                        |

`can_access_user_data` üzerindeki CHECK kısıtı kasıtlıdır: veritabanı seviyesinde,
bir platform yöneticisinin kiracı verisine doğrudan erişim bayrağı **hiçbir zaman**
`TRUE` yapılamaz. Erişim yalnızca `support_access_requests` akışından geçebilir.

### support_access_requests

Platform yöneticisinin bir kiracının verisine geçici erişim talebi. Onay akışı ve
süre sınırı içerir.

| Sütun                                                 | Tip         | Açıklama                                     |
| ----------------------------------------------------- | ----------- | -------------------------------------------- |
| `support_user_id`, `target_org_id`                    | INTEGER FK  | Kim, hangi organizasyon için                 |
| `ticket_number`, `reason`                             | —           | Gerekçe; `reason` zorunlu                    |
| `approval_status`                                     | VARCHAR(20) | `pending`, `approved`, `rejected`, `expired` |
| `approved_by`, `approved_at`                          | —           | Onay bilgisi                                 |
| `access_granted_at`, `access_expires_at`              | TIMESTAMPTZ | Erişim penceresi                             |
| `access_duration_minutes`                             | INTEGER     | Varsayılan 60                                |
| `can_view_data`, `can_modify_data`, `can_export_data` | BOOLEAN     | Sırasıyla `TRUE`, `FALSE`, `FALSE`           |
| `actions_log`                                         | JSONB       | Erişim süresince yapılan işlemler            |
| `revoked_at`, `revoked_by`, `revoke_reason`           | —           | Erken iptal                                  |

Varsayılanlar en dar yetkiyi verir: onaylanan bir talep okuma izniyle başlar,
değiştirme ve dışa aktarma ayrıca açılmalıdır.

### refresh_tokens

Yenileme token'ları. Token'ın kendisi değil, `token_hash` saklanır.

| Sütun                                      | Tip         | Açıklama                                            |
| ------------------------------------------ | ----------- | --------------------------------------------------- |
| `user_id`                                  | INTEGER FK  |                                                     |
| `token_hash`                               | TEXT        | Düz token asla saklanmaz                            |
| `token_family`                             | UUID        | Oturum kimliği — aşağıya bakın                      |
| `device_info`                              | TEXT        | Girişte kaydedilir, rotasyon boyunca taşınır        |
| `session_name`                             | TEXT        | Okunabilir oturum adı (`Session from <user-agent>`) |
| `expires_at`, `created_at`, `last_used_at` | TIMESTAMPTZ | `last_used_at` her doğrulamada güncellenir          |
| `is_revoked`                               | BOOLEAN     |                                                     |

**Token ailesi (token family) modeli:** her giriş yeni bir `token_family` UUID'si
başlatır; yani ikinci bir cihazdan giriş yapmak ilk oturumu etkilemez. Yenileme
sırasında mevcut ailenin token'ları iptal edilir ve **aynı aile** ile yeni bir token
yazılır. Böylece tek bir oturum, kullanıcıyı diğer cihazlardan çıkarmadan geçersiz
kılınabilir.

Süresi dolan kayıtlar `node-cron` tabanlı `tokenCleanupService` tarafından
temizlenir — bkz. [token-cleanup.md](./token-cleanup.md).

---

## İş verisi

### customers

| Sütun                                       | Tip           | Açıklama                                           |
| ------------------------------------------- | ------------- | -------------------------------------------------- |
| `customer_id`                               | SERIAL PK     |                                                    |
| `org_id`                                    | INTEGER FK    | Kiracı kapsamı — zorunlu                           |
| `customer_code`                             | VARCHAR(50)   | Organizasyon içinde benzersiz                      |
| `name`                                      | VARCHAR(255)  | Zorunlu                                            |
| `email`, `phone`, `mobile`                  | —             | İletişim                                           |
| `city`, `country`, `address`, `postal_code` | —             | Adres                                              |
| `tax_number`, `tax_office`                  | —             | Vergi bilgisi                                      |
| `segment`                                   | VARCHAR(50)   | `VIP`, `Premium`, `Standard`, `Basic`, `Potential` |
| `customer_type`                             | VARCHAR(50)   | `Corporate`, `Individual`, `Government`, `Other`   |
| `payment_terms`                             | INTEGER       | Gün cinsinden vade, varsayılan 30                  |
| `credit_limit`                              | DECIMAL(15,2) |                                                    |
| `assigned_user_id`                          | INTEGER FK    | Müşteriden sorumlu kullanıcı                       |
| `notes`, `is_active`, `created_by`          | —             |                                                    |

Analitik için türetilen alanlar:

| Sütun                                       | Açıklama                                                     |
| ------------------------------------------- | ------------------------------------------------------------ |
| `first_purchase_date`, `last_purchase_date` | İlk ve son sipariş tarihi                                    |
| `total_orders`, `total_lifetime_value`      | Toplam sipariş sayısı ve cirosu                              |
| `rfm_score`, `rfm_segment`                  | RFM analizi çıktısı — bkz. [insights.md](../api/insights.md) |

`rfm_segment` üzerinde yalnızca `NOT NULL` satırları kapsayan kısmi indeks vardır.

### products

| Sütun                               | Tip           | Açıklama                        |
| ----------------------------------- | ------------- | ------------------------------- |
| `id`                                | SERIAL PK     |                                 |
| `org_id`                            | INTEGER FK    | Kiracı kapsamı — zorunlu        |
| `name`, `description`               | —             |                                 |
| `sku`                               | VARCHAR(100)  | Zorunlu                         |
| `barcode`, `category`, `unit`       | —             | `category` ve `unit` zorunlu    |
| `base_price`, `price`, `cost_price` | DECIMAL(10,2) | Liste, satış ve maliyet fiyatı  |
| `tax_rate`                          | DECIMAL(5,2)  |                                 |
| `stock_quantity`                    | INTEGER       | Zorunlu, varsayılan 0           |
| `low_stock_threshold`               | INTEGER       | Varsayılan 10                   |
| `reorder_point`                     | INTEGER       | Varsayılan 10                   |
| `lead_time_days`                    | INTEGER       | Tedarik süresi, varsayılan 7    |
| `last_restock_date`                 | TIMESTAMPTZ   | Son stok girişi                 |
| `times_out_of_stock`                | INTEGER       | Stok tükenme sayacı             |
| `deleted_at`                        | TIMESTAMPTZ   | **Soft delete:** `NULL` = aktif |
| `is_active`, `created_by`           | —             |                                 |

Ürünler kalıcı olarak silinmez; `deleted_at` doldurulur. Böylece geçmiş siparişlerin
ürün referansı korunur. Aktif ürünler için `WHERE deleted_at IS NULL` koşullu kısmi
indeks tanımlıdır.

> `reorder_point` ve `lead_time_days` şu an yalnızca veri olarak tutulur; bunlara
> dayalı otomatik sipariş tetikleme uygulanmamıştır.

### orders

| Sütun                                                                       | Tip                | Açıklama                                                                |
| --------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `id`                                                                        | SERIAL PK          |                                                                         |
| `org_id`, `customer_id`                                                     | INTEGER FK         | İkisi de zorunlu                                                        |
| `order_number`                                                              | VARCHAR(50) UNIQUE | Otomatik üretilir (`ORD2025000001`)                                     |
| `order_date`, `expected_delivery_date`                                      | TIMESTAMPTZ        |                                                                         |
| `status`                                                                    | VARCHAR(20)        | `draft`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| `payment_status`                                                            | VARCHAR(20)        | `pending`, `partial`, `paid`, `refunded`                                |
| `payment_method`, `paid_amount`                                             | —                  |                                                                         |
| `shipping_address`, `shipping_city`                                         | —                  | Teslimat adresi                                                         |
| `billing_address`, `billing_city`                                           | —                  | Fatura adresi                                                           |
| `subtotal`, `discount_percentage`, `discount_amount`, `tax_amount`, `total` | DECIMAL            | Tutarlar sunucu tarafında hesaplanır                                    |
| `paid_at`, `fulfilled_at`, `shipped_at`, `delivered_at`                     | TIMESTAMPTZ        | Yaşam döngüsü zaman damgaları                                           |
| `notes`, `created_by`                                                       | —                  |                                                                         |

Durum akışı:

```
draft → confirmed → processing → shipped → delivered
          ↓
      cancelled   (delivered dışındaki her durumdan)
```

Ödeme durumu sipariş durumundan bağımsız ilerler:
`pending → partial → paid`, ayrıca `refunded`.

### order_items

Sipariş kalemleri. Ürün bilgisi sipariş anında **kopyalanarak** saklanır.

| Sütun                                                   | Tip        | Açıklama                       |
| ------------------------------------------------------- | ---------- | ------------------------------ |
| `order_id`                                              | INTEGER FK |                                |
| `product_id`                                            | INTEGER FK | Ürün silinirse `SET NULL`      |
| `product_name`, `product_sku`, `product_category`       | —          | Sipariş anındaki anlık görüntü |
| `quantity`, `unit_price`, `tax_rate`, `discount_amount` | —          |                                |
| `subtotal`, `tax_amount`, `total`                       | DECIMAL    |                                |

`product_name` / `product_sku` / `product_category` alanları bilinçli bir
denormalizasyondur: ürün sonradan silinse veya yeniden fiyatlandırılsa bile geçmiş
siparişler o günkü haliyle okunabilir kalır.

---

## Denetim

### audit_logs

| Sütun                                                        | Tip          | Açıklama                             |
| ------------------------------------------------------------ | ------------ | ------------------------------------ |
| `id`                                                         | BIGSERIAL PK |                                      |
| `user_id`, `user_email`, `user_role`                         | —            | İşlemi yapan                         |
| `impersonating_user_id`                                      | INTEGER FK   | Destek erişimiyle yapılan işlemlerde |
| `action`, `resource_type`, `resource_id`                     | —            | Ne yapıldı, neyin üzerinde           |
| `org_id`                                                     | INTEGER FK   | Hangi kiracı bağlamında              |
| `old_value`, `new_value`, `metadata`                         | JSONB        | Değişiklik öncesi/sonrası            |
| `ip_address`, `user_agent`, `request_path`, `request_method` | —            | İstek bağlamı                        |
| `success`, `error_message`                                   | —            | Başarısız denemeler de kaydedilir    |

`user_email` ve `user_role` alanları, kullanıcı sonradan silinse bile kaydın
okunabilir kalması için kopyalanarak saklanır.

---

## Fonksiyonlar ve view'lar

| Nesne                                   | Amaç                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| `get_user_role_in_org(user_id, org_id)` | Kullanıcının ilgili organizasyondaki rolünü döndürür    |
| `user_has_permission(...)`              | Rol ve `permissions` JSONB'sine göre izin kontrolü      |
| `update_updated_at_column()`            | `updated_at` sütununu güncelleyen trigger fonksiyonu    |
| `v_user_organization_access`            | Kullanıcı–organizasyon erişimini tek sorguda veren view |

> **Bilinen eksik:** `insightsModel.js`, `calculate_rfm_scores($1)` fonksiyonunu
> çağırır ancak bu fonksiyon şemada tanımlı değildir. Bu haliyle
> `GET /api/v1/insights/customers/rfm` uç noktası hata döndürür.

## Trigger'lar

`update_updated_at_column()` fonksiyonu, `updated_at` sütunu olan sekiz tabloya
`BEFORE UPDATE` trigger'ı olarak bağlıdır: `organizations`, `users`,
`user_organization_roles`, `platform_admins`, `support_access_requests`,
`customers`, `products`, `orders`.

---

## Çok kiracılı model

İzolasyon, uygulama katmanında `org_id` ile sağlanır. PostgreSQL Row Level Security
kullanılmaz.

Bunun tek pratik sonucu şudur: **kiracı verisine dokunan her sorgu `org_id` ile
kapsanmak zorundadır.** Eksik bir kapsam, veriyi kiracılar arasında sızdırır.

```sql
-- Doğru
SELECT * FROM customers WHERE org_id = $1 AND customer_id = $2;

-- Yanlış — başka bir kiracının kaydını döndürebilir
SELECT * FROM customers WHERE customer_id = $1;
```

İstek başına organizasyon bağlamı `middleware/orgContext.js` tarafından çözülür.

## org_uuid kullanımı

`organizations` tablosunda iki tanımlayıcı vardır:

| Alan              | Kullanım                             |
| ----------------- | ------------------------------------ |
| `org_id` (SERIAL) | Dahili — foreign key'ler ve sorgular |
| `org_uuid` (UUID) | Dışa açık — URL ve API yanıtları     |

Ardışık tamsayı ID'ler dışarıya verildiğinde kiracı sayısı tahmin edilebilir ve
komşu kayıtlar denenebilir hale gelir. UUID bunu engeller. Dahili birleştirmelerde
ise tamsayı anahtar hem daha küçük hem daha hızlıdır.

---

## Performans

Şemada 59 indeks tanımlıdır. Öne çıkan desenler:

- Kiracı bazlı erişim için `org_id` üzerinde indeksler
- Aktif ürünler için `WHERE deleted_at IS NULL` kısmi indeksi
- RFM segmenti için `WHERE rfm_segment IS NOT NULL` kısmi indeksi
- Yenileme token'ı aramaları için `refresh_tokens` üzerinde indeksler; ek ayarlar
  [`optimize-refresh-tokens.sql`](../../scripts/optimize-refresh-tokens.sql)
  içindedir

## Şema değişiklikleri

Ayrı bir migration altyapısı yoktur. Şema tek dosyadan, `init-schema.sql` üzerinden
uygulanır ve yalnızca veritabanı **ilk kez** oluşturulurken çalışır.

Mevcut bir kurulumda şema değiştirmek için ALTER ifadelerini elle çalıştırmanız
gerekir. Geliştirme ortamında sıfırdan başlamak için:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

> `down -v` komutu veritabanı volume'ünü siler; tüm veri kaybolur.

## İlgili dokümanlar

- [Çok kiracılı roller ve izinler](./multi-tenant-roles.md)
- [Güvenlik](./security.md)
- [HTTP-only çerezler](./http-only-cookies.md)
- [Token temizliği](./token-cleanup.md)
