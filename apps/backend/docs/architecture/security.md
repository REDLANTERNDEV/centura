# Organizasyon Bağlamı Güvenliği

Bu doküman, isteklerin doğru organizasyona (kiracıya) nasıl bağlandığını ve bunun
nasıl doğrulandığını anlatır. Genel güvenlik önlemleri için
[README güvenlik bölümüne](../../../../README.tr.md#güvenlik) bakın; burada
yalnızca organizasyon bağlamı ele alınır.

## Akış

1. **Kimlik doğrulama** — JWT, HTTP-only çerezde taşınır; `userId` ve `email`
   içerir.
2. **Organizasyon seçimi** — Kullanıcı organizasyon seçtiğinde, frontend yalnızca
   `org_id`'yi `localStorage`'a yazar (tam organizasyon nesnesini değil) ve
   `X-Organization-ID` başlığını her isteğe ekler.
3. **Yetkilendirme** — Backend, JWT'yi doğrular, `X-Organization-ID` başlığını
   okur, kullanıcının o organizasyona erişimi olup olmadığını
   `user_organization_roles` üzerinden kontrol eder ve sorguları o organizasyonla
   sınırlar.

```typescript
// Frontend: yalnızca id saklanır, tam nesne değil
localStorage.setItem('centura_selected_org_id', String(org.org_id));
apiClient.defaults.headers.common['X-Organization-ID'] = String(org.org_id);
```

## Üç middleware, tek amaç

Tanım: [`middleware/orgContext.js`](../../src/middleware/orgContext.js).
Üçü de aynı doğrulamayı yapar; farkları başlık yoksa ne olacağındadır.

| Middleware           | Başlık yoksa               | Nerede kullanılıyor                                       |
| -------------------- | -------------------------- | --------------------------------------------------------- |
| `validateOrgContext` | 400 döner                  | `insightsRoutes.js`                                       |
| `optionalOrgContext` | Bağlam olmadan devam eder  | Kullanılmıyor                                             |
| `flexibleOrgContext` | JWT'deki `org_id`'ye düşer | `customerRoutes.js`, `orderRoutes.js`, `productRoutes.js` |

**Önemli:** Uygulamadaki asıl yaygın davranış `flexibleOrgContext`'tir —
müşteri, sipariş ve ürün route'larının tamamı bunu kullanır. `validateOrgContext`
yalnızca `insights` route'larında kullanılıyor.

### flexibleOrgContext'in JWT geri düşüşü

Başlık yoksa `flexibleOrgContext`, erişim token'ının içindeki `org_id`'yi kullanır:

```javascript
if (req.user.org_id) {
  req.organization = { id: req.user.org_id, role: null, name: null };
  return next();
}
```

Bu durumda `req.organization.role` **`null`** olur — rol, header ile gelen tam
doğrulamada olduğu gibi tekrar sorgulanmaz. JWT'deki `org_id`, token üretildiği
andaki değeri taşır; kullanıcının o organizasyondaki rolü sonradan değiştirilmiş
veya erişimi kaldırılmış olsa bile, token süresi dolana kadar eski `org_id` ile
istek geçebilir. Rolün kesin olarak bilinmesi gereken uç noktalar
`validateOrgContext` kullanmalıdır.

### Header doğrulanırken

`validateOrgContext` ve `flexibleOrgContext`'in header-var yolu aynı kontrolleri
yapar:

1. Kullanıcının bu organizasyona bir rolü var mı (`user_organization_roles`)?
2. O rol aktif mi (`role_active`)?
3. Organizasyonun kendisi aktif mi (`org_active`)?

Üçünden biri başarısızsa `403` döner.

## Header formatı

`X-Organization-ID` hem sayısal `org_id`'yi hem de `org_uuid`'yi kabul eder;
`validateOrgContext` içeriğe `-` karakteri olup olmadığına bakarak ayrım yapar ve
UUID ise formatı regex ile doğrular. `flexibleOrgContext` yalnızca sayısal ID
kabul eder.

## Sorgu izolasyonu

Organizasyon doğrulandıktan sonra kontrolcüler `req.organization.id`'yi kullanır;
sorgular parametreli olarak `org_id` ile sınırlanır:

```javascript
export const getProducts = async (req, res) => {
  const orgId = req.organization.id;
  const products = await getProductsByOrg(orgId); // WHERE org_id = $1
  return res.json({ success: true, data: products });
};
```

Sütun adı `org_id`'dir (`organization_id` değil). Tüm sorgular parametreli
çalışır (`$1`, `$2`, ...); string birleştirme kullanılmaz.

## Yeni bir route eklerken

```javascript
import { verifyToken } from '../middleware/auth.js';
import { flexibleOrgContext } from '../middleware/orgContext.js';

router.get('/', verifyToken, flexibleOrgContext, getProducts);
```

Rolün kesin olarak doğrulanması gereken bir uç noktaysa (`req.organization.role`
`null` olmamalıysa), `flexibleOrgContext` yerine `validateOrgContext` tercih edin.

## Bilinen sorun: hata ayıklama logları

`orgContext.js`, her istekte kullanıcının e-postasını, organizasyon kimliğini ve
rolünü `console.log` / `console.warn` ile yazdırır:

```javascript
console.log('🔍 Organization Context Debug:', {
  url: req.url,
  method: req.method,
  headers: { 'x-organization-id': orgIdentifier },
  user: req.user?.email,
});
```

Bu, `NODE_ENV`'den bağımsız olarak **her ortamda** çalışır. Prodüksiyonda konteyner
loglarına kullanıcı e-postaları ve erişim desenleri yazılıyor demektir. Log
seviyesine bağlı hâle getirilmesi veya kaldırılması önerilir.

## Test

```bash
# Geçerli erişim
curl -H "Cookie: access_token=..." \
     -H "X-Organization-ID: 2" \
     http://localhost:8765/api/v1/products
# Beklenen: 200

# Erişimi olmayan organizasyon
curl -H "Cookie: access_token=..." \
     -H "X-Organization-ID: 999" \
     http://localhost:8765/api/v1/products
# Beklenen: 403 ORG_ACCESS_DENIED

# Başlık yok, flexibleOrgContext kullanan bir route (örn. /products)
curl -H "Cookie: access_token=..." \
     http://localhost:8765/api/v1/products
# Beklenen: 200, JWT'deki org_id ile (role: null)

# Başlık yok, validateOrgContext kullanan bir route (örn. /insights)
curl -H "Cookie: access_token=..." \
     http://localhost:8765/api/v1/insights
# Beklenen: 400 ORG_CONTEXT_REQUIRED
```

## İlgili dokümanlar

- [Çok kiracılı roller](./multi-tenant-roles.md)
- [Veritabanı şeması](./database.md)
- [HTTP-only çerezler](./http-only-cookies.md)
