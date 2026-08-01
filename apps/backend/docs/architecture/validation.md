# Backend Validasyonu

Backend, girdi doğrulaması için hiçbir kütüphane kullanmaz (Joi, Zod, Yup vb.
yok) — el yazımı, saf JavaScript fonksiyonlarla çalışır. Bu bilinçli bir
tercihtir: harici bağımlılık eklenmez, `npm audit` yüzeyi büyümez, doğrulama
mantığı tamamen kod tabanının kontrolündedir.

> Bu, [frontend'in Zod kullanımından](../../../frontend/docs/architecture/validation.md)
> bağımsız bir katmandır. İki taraf birbirinden habersizdir — frontend'de geçen
> bir form, backend'de farklı kurallarla reddedilebilir. Yetkili olan her zaman
> backend'dir.

## Konum

```
src/validators/
├── organizationValidator.js
├── customerValidator.js
├── orderValidator.js
└── productValidator.js
```

## İki farklı çağrı biçimi

Doğrulayıcılar, dosyaya göre iki farklı biçimde yazılmış — kod tabanında ikisi
de bir arada bulunuyor, bunu bilmek route eklerken karışıklığı önler.

**1. Express middleware biçimi** (`organizationValidator.js`, `customerValidator.js`):

```javascript
export const validateCreateOrganization = (req, res, next) => {
  const errors = [];
  // ... alanları kontrol et, errors'a ekle
  if (errors.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Validation failed', errors });
  }
  req.validatedData = { org_name: data.org_name.trim() /* ... */ };
  return next();
};
```

Route'a doğrudan middleware olarak eklenir:

```javascript
router.post(
  '/',
  verifyToken,
  validateCreateOrganization,
  createNewOrganization
);
```

Kontrolcü, ham `req.body` yerine `req.validatedData`'yı kullanır — trim edilmiş
ve normalize edilmiş hâli budur.

**2. Saf fonksiyon biçimi** (`orderValidator.js`, `productValidator.js`):

```javascript
export const validateOrderCreate = data => {
  const errors = [];
  if (!customer_id) errors.push('Customer ID is required');
  // ...
  return { isValid: errors.length === 0, errors };
};
```

Route'a middleware olarak **eklenmez**; kontrolcü içinden elle çağrılır:

```javascript
// orderController.js
const validation = validateOrderCreate(req.body);
if (!validation.isValid) {
  return res.status(400).json({ success: false, errors: validation.errors });
}
```

Yeni bir route eklerken hangi deseni kullanacağınız, o kaynağın diğer
doğrulayıcılarıyla tutarlı olmalıdır — `organizationValidator.js`'e yeni bir
middleware-biçimi fonksiyon, `orderValidator.js`'e yeni bir saf fonksiyon
eklemek gibi.

## Neden Joi/Zod değil

Kaynak koddaki yorum gerekçeyi özetliyor:

```javascript
// Customer Validation - Native JavaScript (Zero Dependencies)
// Why no Joi/Zod/Yup?
// - Reduces bundle size (~200KB saved)
// - Faster performance (no library overhead)
// - Full control over validation logic
```

Bağımlılık eklememenin somut faydası, `min-release-age` ve `ignore-scripts`
politikalarıyla aynı yönde: daha küçük tedarik zinciri yüzeyi. Dezavantajı,
her yeni alan için elle kod yazmak ve iki doğrulayıcı biçiminin bir arada
bulunmasıdır.

## Hata biçimi

Middleware biçimi:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "org_name", "message": "..." }]
}
```

Saf fonksiyon biçimi:

```json
{ "success": false, "errors": ["Customer ID is required", "..."] }
```

İki biçim arasında `errors` alanının şekli farklıdır (nesne dizisi vs. string
dizisi) — bir istemci yazıyorsanız hangi uç noktanın hangi biçimi döndürdüğünü
kontrol edin.

## İlgili dokümanlar

- [Frontend validasyonu (Zod)](../../../frontend/docs/architecture/validation.md)
- [Veritabanı şeması](./database.md)
