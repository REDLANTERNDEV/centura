# Kayıt ve Organizasyon Akışı

> Bu dosya, daha önce ayrı ayrı bulunan üç dokümanın (kullanıcı kaydı, organizasyon
> seçimi, organizasyon oluşturma) birleştirilmiş hâlidir — akışın tamamı tek bir
> kullanıcı yolculuğu olduğu için ayrı dosyalarda tutmak gereksiz tekrara yol
> açıyordu.

## Akışa genel bakış

```
Kayıt (email, parola, ad)
  → Giriş
  → Kullanıcının organizasyonları çekilir
    ├── 0 organizasyon  → "Organizasyon Oluştur" ekranı
    ├── 1 organizasyon  → otomatik seçilir, dashboard'a geçilir
    └── 2+ organizasyon → localStorage'daki son seçim varsa otomatik,
                           yoksa seçim ekranı gösterilir
  → Dashboard
```

## 1. Kayıt

Uç nokta: `POST /api/v1/auth/signup` ([`userController.js`](../../../backend/src/controllers/userController.js))

Yalnızca üç alan zorunludur: `email`, `password` (min 8 karakter), `name` (min 2
karakter). Organizasyon bilgisi kayıt sırasında istenmez — kullanıcı organizasyonsuz
oluşturulur (`org_id: null`) ve organizasyona giriş yaptıktan sonra karar verir.

İstek gövdesi bir `inviteToken` alanı kabul eder, ancak **bu alan şu an hiçbir işlev
görmez** — sunucu tarafında yalnızca loglanır:

```javascript
if (inviteToken) {
  // Invite token functionality will be implemented separately
  console.log('Invite token provided:', inviteToken);
}
```

Davetle katılma sistemi henüz yok; bu, README'deki "Henüz uygulanmadı" listesinde
de yer alıyor.

## 2. Organizasyon bağlamı: OrganizationContext

Tanım: [`lib/contexts/OrganizationContext.tsx`](../../lib/contexts/OrganizationContext.tsx)

Uygulama, `OrganizationProvider` ile sarılır ve `useOrganization()` hook'u her
yerden erişilebilir:

```tsx
<OrganizationProvider>
  <DashboardLayoutClient>{children}</DashboardLayoutClient>
</OrganizationProvider>
```

Seçim mantığı: kullanıcının organizasyonları çekilir; tek organizasyon varsa
otomatik seçilir; birden fazla varsa `localStorage`'daki son seçim aranır.

**Depolanan değer yalnızca `org_id`'dir, tam organizasyon nesnesi değil:**

```javascript
const ORG_STORAGE_KEY = 'centura_selected_org_id'; // yalnızca id, tam nesne değil
localStorage.setItem(ORG_STORAGE_KEY, org.org_id.toString());
```

Bu anahtar, çıkışta ([`api-client.ts`](../../lib/api-client.ts),
[`app-sidebar.tsx`](../../components/app-sidebar.tsx), giriş sayfası) tutarlı
biçimde temizlenir — farklı bir hesapla giriş yapan kullanıcının önceki seçili
organizasyonla karşılaşmaması için.

Seçili organizasyonun `org_id`'si her isteğe `X-Organization-ID` başlığı olarak
eklenir ([`api-client.ts`](../../lib/api-client.ts)); backend'in bunu nasıl
doğruladığı için [security.md](../../../backend/docs/architecture/security.md)
içindeki `flexibleOrgContext` bölümüne bakın.

## 3. İlgili bileşenler

| Bileşen                | Görev                                                                      |
| ---------------------- | -------------------------------------------------------------------------- |
| `OrganizationSelector` | Organizasyon yoksa veya birden fazlaysa gösterilen tam ekran seçim arayüzü |
| `OrganizationSwitcher` | Sidebar/header içinde hızlı organizasyon değiştirme                        |
| `DashboardLayout`      | Organizasyon seçildiğinde gösterilen sidebar + header düzeni               |

```tsx
export default function DashboardPage() {
  const { selectedOrganization, isLoading } = useOrganization();
  if (isLoading) return <LoadingSpinner />;
  if (!selectedOrganization) return <OrganizationSelector />;
  return <DashboardContent />;
}
```

## 4. Organizasyon oluşturma

Route: `app/organizations/create/page.tsx` — **dashboard layout'un dışında**,
tam ekran, sidebar/navbar olmadan render edilir. Amaç, oluşturma sırasında
dikkat dağıtıcı unsurları kaldırmaktır.

```
app/
├── (dashboard)/          # Sidebar + navbar olan route'lar
├── (public)/             # Kimlik doğrulama gerektirmeyen route'lar (login, signup)
└── organizations/
    └── create/            # Bağımsız, tam ekran
```

Bu sayfa kendi form state'ini ve doğrulamasını yönetir — `organization.schema.ts`
içindeki Zod şeması **kullanılmaz** (ayrıntı için
[validation.md](./validation.md#kullanılmayan-şemalar) içindeki "kullanılmayan
şemalar" bölümüne bakın). Gönderilen alan adı `org_name`'dir; backend'in hem Zod
şeması hem doğrulayıcısı bu ismi bekler.

Oluşturma isteği başarılı olduğunda:

```javascript
// organizationController.js
await roleModel.assignRoleToUser(
  userId,
  newOrganization.org_id,
  'org_owner',
  null
);
```

Oluşturan kullanıcı otomatik olarak `org_owner` olur — ayrı bir atama adımı
gerekmez.

> **Not:** Bazı eski sürüm dokümanlarında bahsedilen otomatik "slug" alanı
> gerçekte yoktur — `organizations` tablosunda böyle bir sütun bulunmuyor. Form
> yalnızca `org_name`, `industry`, `phone`, `email`, `address`, `city`,
> `country`, `tax_number` alanlarını kabul eder (bkz.
> [database.md](../../../backend/docs/architecture/database.md#organizations)).

## 5. Güvenlik notu

Frontend'deki organizasyon bağlamı yalnızca kullanıcı deneyimi içindir. Her
istekte gerçek yetki kontrolü backend'de yapılır — `flexibleOrgContext` veya
`validateOrgContext` middleware'i, `user_organization_roles` tablosuna karşı
doğrulama yapmadan hiçbir veri döndürmez. Ayrıntı için
[security.md](../../../backend/docs/architecture/security.md).

## İlgili dokümanlar

- [Validasyon (Zod)](./validation.md)
- [Çok kiracılı roller](../../../backend/docs/architecture/multi-tenant-roles.md)
- [Organizasyon bağlamı güvenliği](../../../backend/docs/architecture/security.md)
