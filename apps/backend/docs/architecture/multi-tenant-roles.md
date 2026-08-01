# Çok Kiracılı Rol Sistemi

Kullanıcı yetkisi organizasyon bazlıdır. Bir kullanıcı birden fazla organizasyona,
her birinde farklı bir rolle üye olabilir. Sistem genelinde tüm organizasyonları
yönetebilen bir "süper admin" rolü **yoktur** — bu kasıtlı bir tasarım kararıdır,
aşağıya bakın.

## Veri modeli

Rol ataması `user_organization_roles` tablosunda tutulur, `users` tablosunda değil:

```sql
user_id, org_id, role, permissions (JSONB), is_active, assigned_by, assigned_at
```

Roller, en geniş yetkiden en dara:

| Rol         | Kapsam                                                |
| ----------- | ----------------------------------------------------- |
| `org_owner` | Organizasyon üzerinde tam yetki; sahiplik devri dâhil |
| `org_admin` | Kullanıcı ve ayar yönetimi                            |
| `manager`   | Müşteri, sipariş ve ürünlerin günlük yönetimi         |
| `user`      | Standart operasyonel erişim                           |
| `viewer`    | Yalnızca okuma                                        |

Ayrıntılı sütun listesi için [database.md](./database.md#user_organization_roles).

## system_role ve platform_admin

`users.system_role` sütunu tek bir kısıtla sınırlıdır:

```sql
CHECK (system_role = 'platform_admin' OR system_role IS NULL)
```

`'platform_admin'` dışında hiçbir değer veritabanı seviyesinde kabul edilmez.
Platform yöneticiliği, kiracı verisine otomatik erişim **vermez** — ayrı bir
onay akışından geçer, bkz. [database.md](./database.md#platform_admins) ve
[support_access_requests](./database.md#support_access_requests).

## `super_admin` neden yok

Kod tabanında `super_admin` dizesi hâlâ birkaç yerde geçiyor, ancak hepsi ölü koddur
veya kasıtlı olarak devre dışı bırakılmıştır:

- `roleModel.isSuperAdmin()` her zaman `false` döner. Kaynak koddaki yorum
  açıklayıcı: _"No more super admins - full tenant isolation."_
- `requireSuperAdmin` middleware'i, hangi kullanıcı çağırırsa çağırsın **her zaman**
  403 döner:

  ```json
  {
    "success": false,
    "message": "Super admin access has been removed for security. Use organization-based roles.",
    "code": "SUPER_ADMIN_DEPRECATED"
  }
  ```

- `getUserPermissions()` sorgusundaki `WHEN u.system_role = 'super_admin' THEN 100`
  dalı hiçbir zaman eşleşmez, çünkü `system_role` veritabanı seviyesinde yalnızca
  `'platform_admin'` veya `NULL` olabilir.

Bu üçü birlikte, sistem genelinde tüm kiracılara erişebilen tek bir hesap riskinin
bilinçli olarak kaldırıldığını gösteriyor. Yeni kod bu isimleri kullanmamalı;
mevcut ölü referanslar temizlenmeyi bekliyor.

> **Bilinen temizlik ihtiyacı:** `roleModel.js` ve `organizationRoutes.js`
> içindeki `super_admin` yorumları ve ulaşılamayan CASE dalı kafa karıştırıcı.
> Kaldırılmaları önerilir.

## Middleware'ler

Tanım: [`middleware/auth.js`](../../src/middleware/auth.js)

| Middleware                       | Davranış                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `requireOrgRole(...roles)`       | İsteğin organizasyonunda, kullanıcının rolü listelenenlerden biri değilse 403 |
| `requireOrgAdmin`                | `requireOrgRole('org_owner', 'org_admin')`'in kısayolu                        |
| `requireOrgOwner`                | `requireOrgRole('org_owner')`'ın kısayolu                                     |
| `requireManager`                 | `requireOrgRole('org_owner', 'org_admin', 'manager')`'ın kısayolu             |
| `requireOrgPermission(minLevel)` | Sayısal yetki seviyesi eşiği — aşağıya bakın                                  |
| `requireSuperAdmin`              | **Her zaman 403.** Kaldırılmadı; kasıtlı olarak devre dışı                    |
| `requireRole(...roles)`          | **Deprecated.** Eski, organizasyon bağlamı olmayan rol kontrolü               |

`requireOrgRole`, organizasyon kimliğini şu sırayla arar: route parametresi (`:id`
veya `:org_id`), istek gövdesi (`org_id`), son çare olarak kullanıcının varsayılan
organizasyonu.

Kullanım:

```javascript
router.put(
  '/:id',
  verifyToken,
  requireOrgRole('org_owner', 'org_admin'),
  updateOrg
);
```

## Yetki seviyesi (permission_level)

`roleModel.getUserPermissions(userId, orgId)`, sayısal bir yetki seviyesi üretir:

| Rol         | Seviye |
| ----------- | ------ |
| `org_owner` | 80     |
| `org_admin` | 60     |
| `manager`   | 40     |
| `user`      | 20     |
| `viewer`    | 10     |
| (rol yok)   | 0      |

`requireOrgPermission(minLevel)` bu değeri eşik olarak kullanır:

```javascript
router.delete('/:id', verifyToken, requireOrgPermission(60), deleteResource);
```

## roleModel.js fonksiyonları

Tanım: [`models/roleModel.js`](../../src/models/roleModel.js)

**Rol yönetimi:**

```javascript
await roleModel.assignRoleToUser(userId, orgId, 'org_admin', assignedBy);
await roleModel.updateUserRole(userId, orgId, 'manager', updatedBy);
await roleModel.removeUserFromOrg(userId, orgId); // soft delete
await roleModel.deleteUserFromOrg(userId, orgId); // hard delete
await roleModel.bulkAssignRoles([
  { userId: 2, orgId: 1, role: 'org_admin', assignedBy: 10 },
  { userId: 3, orgId: 1, role: 'user', assignedBy: 10 },
]);
```

**Sorgulama:**

```javascript
const role = await roleModel.getUserRoleInOrg(userId, orgId);
const orgs = await roleModel.getUserOrganizations(userId);
const users = await roleModel.getOrganizationUsers(orgId);
const hasRole = await roleModel.userHasRole(userId, orgId, 'manager');
const perms = await roleModel.getUserPermissions(userId, orgId);
// { role, permissions, system_role, permission_level }
```

**Sahiplik devri:**

```javascript
await roleModel.transferOwnership(orgId, fromUserId, toUserId, transferredBy);
// eski sahip → org_admin, yeni sahip → org_owner
```

## Veritabanı yardımcıları

```sql
SELECT get_user_role_in_org(1, 1);           -- 'org_owner'
SELECT user_has_permission(1, 1, 'manager'); -- TRUE / FALSE
SELECT * FROM v_user_organization_access WHERE user_id = 1;
```

`v_user_organization_access` view'ı, bir kullanıcının tüm organizasyonlardaki
rollerini tek sorguda döner — birden fazla organizasyona üye kullanıcılar için
kullanışlıdır.

## JWT ve req.user

Erişim token'ı payload'ı:

```javascript
{ userId, email, orgId, type: 'access', iat, exp }
```

`verifyToken` middleware'i sonrası `req.user`:

```javascript
req.user = {
  id,
  email,
  org_id, // istek bağlamındaki organizasyon
  org_role, // requireOrgRole tarafından doldurulur
  permission_level, // requireOrgPermission tarafından doldurulur
};
```

## İlgili dokümanlar

- [Veritabanı şeması](./database.md)
- [Güvenlik](./security.md)
- [HTTP-only çerezler](./http-only-cookies.md)
