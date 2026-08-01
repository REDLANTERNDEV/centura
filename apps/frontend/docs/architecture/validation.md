# Form Validasyonu (Zod)

> Bu dosya, önceden ayrı ayrı bulunan bir uygulama rehberi ve bir hızlı referans
> kartını birleştirir — ikisi de aynı şemaları anlatıyordu.

`lib/validations/` altındaki şemalar [Zod](https://zod.dev) ile yazılmıştır.
Zod, TypeScript tip çıkarımı destekli, çalışma zamanı (runtime) doğrulama
sağlayan bir kütüphanedir.

## Kullanılan ve kullanılmayan şemalar

Aşağıdaki tablo, her şemanın gerçekten bir bileşen tarafından çağrılıp
çağrılmadığını gösterir — kod taranarak doğrulanmıştır:

| Dosya                    | Şema                       | Durum                                                                                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.schema.ts`         | `loginSchema`              | **Kullanılıyor** — `app/(public)/login/page.tsx`                                                                                                                                                                                                                                                               |
| `auth.schema.ts`         | `signupSchema`             | **Kullanılıyor** — `app/(public)/signup/page.tsx`                                                                                                                                                                                                                                                              |
| `order.schema.ts`        | `createEditOrderSchema`    | **Kullanılmıyor** — bu şemayı yalnızca `edit-order-dialog.tsx` kullanır, ama sipariş sayfası (`page.tsx`) onu render etmez; onun yerine kendi elle yazılmış kontrollerini kullanan `advanced-edit-order-dialog.tsx` render edilir. Bkz. [orders/README.md](<../../app/(dashboard)/dashboard/orders/README.md>) |
| `organization.schema.ts` | `createOrganizationSchema` | **Kullanılmıyor** — organizasyon oluşturma sayfası kendi elle yazılmış doğrulamasını kullanır, bkz. [onboarding.md](./onboarding.md#4-organizasyon-oluşturma)                                                                                                                                                  |
| `product.schema.ts`      | tüm şemalar                | **Kullanılmıyor** — hiçbir bileşende içe aktarılmıyor                                                                                                                                                                                                                                                          |
| `customer.schema.ts`     | tüm şemalar                | **Kullanılmıyor** — hiçbir bileşende içe aktarılmıyor                                                                                                                                                                                                                                                          |

Yani beş dosyadan yalnızca biri (`auth.schema.ts`) gerçekten kullanılıyor;
geri kalan dördü yazılmış ve dışa aktarılmış ama hiçbir bileşen onları
çağırmıyor. Yeni bir form eklerken, önce ilgili şemanın gerçekten kullanılabilir
durumda olduğunu (alan adlarının backend doğrulayıcısıyla eşleştiğini)
doğrulayın — `organizationSchema` örneğinde olduğu gibi, şema ile gerçek
form/backend alan adları arasında sapma olabilir.

## Klasör yapısı

```
lib/validations/
├── auth.schema.ts          # Giriş, kayıt
├── organization.schema.ts  # Kullanılmıyor (yukarıya bakın)
├── product.schema.ts       # Kullanılmıyor
├── customer.schema.ts      # Kullanılmıyor
├── order.schema.ts         # Kullanılmıyor (yukarıya bakın)
├── form-validation.ts      # validateForm / validateField yardımcıları
└── index.ts                # Merkezi export noktası
```

## Kullanım

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { validateForm } from '@/lib/validations/form-validation';

const validation = validateForm(loginSchema, formData);
if (!validation.success) {
  setErrors(validation.errors); // { email: "...", password: "..." }
  return;
}
// validation.data artık tip güvenli
```

`order.schema.ts` içindeki `createEditOrderSchema`, kullanılsaydı `validateForm`
sarmalayıcısı yerine doğrudan Zod'un `.safeParse()` API'siyle çağrılırdı —
ancak yukarıda belirtildiği gibi bu şema şu an ölü koddur, hiçbir bileşenden
çağrılmıyor:

```typescript
// edit-order-dialog.tsx içinde tanımlı ama page.tsx bu bileşeni render etmiyor
const editOrderSchema = createEditOrderSchema(order.total);
const validation = editOrderSchema.safeParse(formData);
```

## Yardımcı fonksiyonlar

Tanım: [`lib/validations/form-validation.ts`](../../lib/validations/form-validation.ts)

| Fonksiyon                                 | Görev                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `validateForm(schema, data)`              | Tüm formu doğrular, `{ success, data }` veya `{ success: false, errors }` döner |
| `validateField(schema, fieldName, value)` | Tek bir alanı doğrular                                                          |
| `getErrorMessages(zodError)`              | Zod hatasını `{ field: message }` biçimine çevirir                              |

## Yaygın kalıplar

```typescript
// Metin
z.string().min(1, 'Zorunlu alan').max(100, 'En fazla 100 karakter');

// Sayı
z.number({ message: 'Geçerli bir sayı girin' }).int().positive();

// Opsiyonel alan
z.string().optional();
z.string().optional().or(z.literal('')); // boş string'e de izin ver
```

## Backend ile ilişkisi

Zod, yalnızca **frontend**'de çalışır — kullanıcı deneyimi için erken geri
bildirim sağlar. Backend, kendi bağımsız doğrulama katmanına sahiptir ve Zod
kullanmaz; bkz.
[backend validasyon dokümanı](../../../backend/docs/architecture/validation.md).
İki katman birbirinden habersizdir: frontend şeması geçse bile backend
doğrulayıcısı farklı kurallar uygulayabilir (nitekim `organization.schema.ts`
tam olarak bu nedenle kullanım dışı kaldı — alan adları backend'le uyuşmuyordu).

## İlgili dokümanlar

- [Kayıt ve organizasyon akışı](./onboarding.md)
- [Backend validasyonu](../../../backend/docs/architecture/validation.md)
