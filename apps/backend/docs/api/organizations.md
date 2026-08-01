# Organizations API

Tanım: [`routes/organizationRoutes.js`](../../src/routes/organizationRoutes.js),
[`controllers/organizationController.js`](../../src/controllers/organizationController.js)

> Bu dokümanın önceki sürümü, `org_code` alanı ve tek organizasyonlu
> admin/user rol modeli içeren daha eski bir mimariyi anlatıyordu. O mimari
> `user_organization_roles` ile değiştirildi (bkz.
> [multi-tenant-roles.md](../architecture/multi-tenant-roles.md)); aşağıdaki
> her endpoint güncel koddan doğrulanmıştır.

## Uç noktalar

| Method | Yol                               | Erişim                                            |
| ------ | --------------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/organizations/me`        | Herhangi bir üyeliği olan kullanıcı               |
| GET    | `/api/v1/organizations`           | Herhangi bir üyeliği olan kullanıcı               |
| GET    | `/api/v1/organizations/:id`       | O organizasyonda herhangi bir rolü olan kullanıcı |
| GET    | `/api/v1/organizations/:id/stats` | O organizasyonda herhangi bir rolü olan kullanıcı |
| GET    | `/api/v1/organizations/:id/users` | `org_owner` veya `org_admin`                      |
| POST   | `/api/v1/organizations`           | Herhangi bir kimliği doğrulanmış kullanıcı        |
| PUT    | `/api/v1/organizations/:id`       | `org_owner` veya `org_admin`                      |
| DELETE | `/api/v1/organizations/:id`       | Yalnızca `org_owner`                              |

**Önemli:** `GET /` ve `GET /me` aynı işi yapar — ikisi de
`roleModel.getUserOrganizations(userId)` çağırır ve kullanıcının üyesi olduğu
organizasyonları döner. **Sistem genelinde "tüm organizasyonları listele" yetkisi
olan bir rol yoktur** — bkz.
[multi-tenant-roles.md](../architecture/multi-tenant-roles.md#super_admin-neden-yok).
`POST /`'da da bir kısıtlama yoktur; herhangi bir kimliği doğrulanmış kullanıcı
kendi organizasyonunu oluşturabilir.

## Organizasyon oluşturma

```json
// POST /api/v1/organizations
{
  "org_name": "Acme Corporation",
  "industry": "Technology",
  "phone": "+90-212-555-1234",
  "email": "info@acme.com",
  "address": "Maslak, İstanbul",
  "city": "İstanbul",
  "country": "Turkey",
  "tax_number": "1234567890"
}
```

Yalnızca `org_name` zorunludur (2–255 karakter). Diğer alanlar opsiyoneldir.
`country` verilmezse `'Turkey'` varsayılır (bkz.
[database.md](../architecture/database.md#organizations)).

```json
// Yanıt (201)
{
  "success": true,
  "message": "Organization created successfully. You are now the organization owner.",
  "data": {
    "org_id": 6,
    "org_name": "Acme Corporation",
    "...": "...",
    "your_role": "org_owner"
  }
}
```

Oluşturan kullanıcı otomatik olarak `org_owner` olur — ayrı bir atama isteği
gerekmez.

## Listeleme ve detay

```json
// GET /api/v1/organizations veya /me
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": [
    { "org_id": 1, "org_name": "Acme", "role": "org_owner", "...": "..." }
  ],
  "count": 1
}
```

```json
// GET /api/v1/organizations/:id
{
  "success": true,
  "data": {
    "org_id": 1,
    "org_name": "Acme",
    "...": "...",
    "your_role": "org_admin"
  }
}
```

`your_role`, isteği yapan kullanıcının **o organizasyondaki** rolüdür —
sistem genelinde bir rol değil.

## Güncelleme

```json
// PUT /api/v1/organizations/:id
{ "org_name": "Updated Name", "phone": "+90-212-555-9999" }
```

`validateUpdateOrganization`, `createOrganizationSchema`'nın kısmi
(partial) hâlidir — yalnızca gönderilen alanlar doğrulanır.

## Silme

```
DELETE /api/v1/organizations/:id
```

**Yalnızca soft delete vardır.** `deleteOrganization()` modeli tek bir
`UPDATE organizations SET is_active = false` çalıştırır; kalıcı silme (hard
delete) seçeneği kodda **yoktur**. Önceki doküman sürümlerinde bahsedilen
`?hard=true` sorgu parametresi gerçekte işlenmiyor.

```json
{ "success": true, "message": "Organization deactivated successfully" }
```

## İstatistikler

```json
// GET /api/v1/organizations/:id/stats
{
  "success": true,
  "data": {
    "total_users": 10,
    "total_customers": 45,
    "active_customers": 42,
    "total_credit_limit": 125000.0
  }
}
```

`total_users`, `users.org_id` sütununa göre sayılır — bu, kullanıcının
**birincil** organizasyonudur. Bir kullanıcı `user_organization_roles`
üzerinden bu organizasyona ikincil üye olarak bağlıysa, birincil `org_id`'si
başka bir organizasyona işaret ediyorsa bu sayıya dahil edilmez.

## Organizasyon kullanıcıları

```json
// GET /api/v1/organizations/:id/users
{
  "success": true,
  "organization": { "org_id": 1, "org_name": "Acme" },
  "users": [
    { "user_id": 1, "email": "...", "role": "org_owner", "...": "..." }
  ],
  "total": 1
}
```

Bu uç nokta diğerlerinden farklı olarak `data` yerine üst seviyede
`organization` / `users` / `total` alanları döner.

## Hata durumları

| Kod | Örnek                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| 400 | `{ "success": false, "message": "Validation failed", "errors": [...] }`                                             |
| 403 | `{ "success": false, "message": "Access denied. Only organization owners and admins can update the organization" }` |
| 404 | `{ "success": false, "message": "Organization not found" }`                                                         |
| 409 | `{ "success": false, "message": "Organization name already exists" }` (unique constraint)                           |

## Bilinen sorun: erişim kontrolünde hata ayıklama logları

`checkUserOrgAccess()` yardımcı fonksiyonu, her `GET /:id`, `PUT /:id`,
`DELETE /:id` ve `/:id/stats` isteğinde kullanıcı kimliğini ve rolünü
`console.log` ile yazdırır — aynı kalıp `orgContext.js` içinde de var, bkz.
[security.md](../architecture/security.md#bilinen-sorun-hata-ayıklama-logları).

## İlgili dokümanlar

- [Çok kiracılı roller](../architecture/multi-tenant-roles.md)
- [Veritabanı şeması](../architecture/database.md)
- [Kayıt ve organizasyon akışı](../../../frontend/docs/architecture/onboarding.md)
