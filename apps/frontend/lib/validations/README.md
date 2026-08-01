# Validasyon Şemaları

Frontend formları için Zod şemaları. Tam doküman — hangi şemaların gerçekten
kullanıldığı dâhil — [../../docs/architecture/validation.md](../../docs/architecture/validation.md)
içindedir.

## Dosyalar

| Dosya                    | Durum                                                   |
| ------------------------ | ------------------------------------------------------- |
| `auth.schema.ts`         | Kullanılıyor (giriş, kayıt)                             |
| `order.schema.ts`        | Kullanılıyor (sipariş düzenleme)                        |
| `organization.schema.ts` | Kullanılmıyor                                           |
| `product.schema.ts`      | Kullanılmıyor                                           |
| `customer.schema.ts`     | Kullanılmıyor                                           |
| `form-validation.ts`     | Yardımcı fonksiyonlar (`validateForm`, `validateField`) |
| `index.ts`               | Merkezi export noktası                                  |

## Hızlı kullanım

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { validateForm } from '@/lib/validations/form-validation';

const validation = validateForm(loginSchema, formData);
if (!validation.success) {
  console.log(validation.errors); // { email: "...", ... }
  return;
}
await apiClient.post('/login', validation.data);
```

Ayrıntılar, kullanılmayan şemaların neden öyle kaldığı ve backend'in bu
şemalardan bağımsız kendi doğrulamasını nasıl yaptığı için
[validation.md](../../docs/architecture/validation.md) dosyasına bakın.
