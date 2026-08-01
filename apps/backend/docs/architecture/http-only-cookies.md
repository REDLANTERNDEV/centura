# HTTP-Only Çerezler

Kimlik doğrulama, `localStorage`'da tutulan JWT yerine HTTP-only çerezlerle
yapılır. Amaç, token'ları JavaScript'ten tamamen gizleyerek XSS ile token
çalınmasını engellemektir.

> Yapılandırma: [`config/cookies.js`](../../src/config/cookies.js)

## Çerez türleri

| Çerez            | İsim            | Süre    | httpOnly | Amaç                               |
| ---------------- | --------------- | ------- | -------- | ---------------------------------- |
| Erişim token'ı   | `access_token`  | 15 dk   | `true`   | API kimlik doğrulama               |
| Yenileme token'ı | `refresh_token` | 7 gün   | `true`   | Erişim token'ını yenileme          |
| CSRF token'ı     | `csrf_token`    | 24 saat | `false`  | Aşağıya bakın — şu an uygulanmıyor |

## Gerçek yapılandırma

```javascript
const baseCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  domain:
    process.env.NODE_ENV === 'production'
      ? process.env.COOKIE_DOMAIN
      : undefined,
};
```

İki noktaya dikkat:

- **`sameSite: 'lax'`**, `'strict'` değil. Kod içindeki yorum nedenini açıklıyor:
  bir bağlantıya tıklayarak siteye gelmek gibi üst düzey (top-level) gezinmelerde
  çerezin gönderilmesine izin verir; `'strict'` bunu engelleyip kullanıcı deneyimini
  bozardı.
- **Yenileme token'ının `path` değeri `/`'dir**, `/api/auth` değil. Kod yorumu:
  _"Changed from '/api/auth' to '/' for better frontend compatibility."_ Yani
  yenileme çerezi, kısıtlı bir yola değil, uygulamanın tamamına gönderilir.

`secure` ve `domain`, `NODE_ENV=production` olup olmamasına göre otomatik ayarlanır
— elle değiştirmeniz gerekmez.

## Kimlik doğrulama akışı

```
POST /api/auth/login  { email, password }
  → kimlik bilgisi doğrulanır
  → access_token ve refresh_token cookie olarak set edilir

GET /api/... (Cookie: access_token=...)
  → verifyToken middleware'i cookie'den token'ı okur ve doğrular

POST /api/auth/refresh-token  (Cookie: refresh_token=...)
  → eski token ailesi iptal edilir, aynı ailede yeni token yazılır
  → bkz. token-cleanup.md: token ailesi (token family) modeli

POST /api/auth/logout  (Cookie: refresh_token=...)
  → token veritabanında iptal edilir (is_revoked = TRUE)
  → cookie'ler temizlenir
```

Yenileme token'ı rotasyonunun ayrıntısı için
[token-cleanup.md](./token-cleanup.md) içindeki token ailesi bölümüne bakın.

## Bilinen sorun: CSRF token'ı üretiliyor ama hiçbir yerde doğrulanmıyor

`middleware/security.js` içinde iki fonksiyon tanımlı:

- `generateCSRFToken` — rastgele bir token üretip session'a ve cookie'ye yazar
- `validateCSRFToken` — `X-CSRF-Token` başlığını session'daki değerle karşılaştırır

**İkincisi hiçbir route'a bağlanmamış.** `app.js`, `security.js`'den yalnızca
`securityHeaders`, `generalLimiter`, `healthCheckLimiter`, `cookieSecurity` ve
`securityLogger`'ı içe aktarır — `validateCSRFToken` hiçbir yerde kullanılmıyor.
CSRF cookie'si, `userController.js` içinde bu middleware'den bağımsız olarak
doğrudan `crypto.randomBytes()` ile üretilip login ve refresh sırasında set
ediliyor, ama hiçbir istekte doğrulanmıyor. Frontend de `csrf_token` cookie'sini
okuyup `X-CSRF-Token` başlığına eklemiyor.

Sonuç: durum değiştiren isteklerin (POST/PUT/DELETE) CSRF karşısındaki tek
koruması şu an **`sameSite: 'lax'`**'tir. Bu, çoğu cross-site senaryoyu engeller ama
`validateCSRFToken`'ın sağladığı çift-gönderim (double-submit) korumasının
kendisi değildir.

**Bunu kapatmak için** iki seçenek var: `validateCSRFToken`'ı durum değiştiren
route'lara middleware olarak eklemek ve frontend'de karşılık gelen header'ı
göndermek; ya da CSRF üretim kodunu kaldırıp yalnızca `sameSite: 'lax'`'e
güvenmek. Şu anki hâl — token üretilip hiç kullanılmaması — hem gereksiz
karmaşıklık hem de yanlış güven duygusu yaratıyor.

## Ortam değişkenleri

```bash
JWT_SECRET=<32+ rastgele karakter>
SESSION_SECRET=<32+ rastgele karakter>
COOKIE_DOMAIN=yourdomain.com   # yalnızca production'da kullanılır
NODE_ENV=production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

`COOKIE_DOMAIN`, `NODE_ENV=production` değilse okunmaz; geliştirmede boş
bırakılabilir.

## Hız sınırlama (rate limiting)

Tanım: [`middleware/security.js`](../../src/middleware/security.js)

| Sınırlayıcı                 | Pencere | Limit      | Kullanıldığı yer                                          |
| --------------------------- | ------- | ---------- | --------------------------------------------------------- |
| `generalLimiter`            | 15 dk   | 100 istek  | Tüm `/api`                                                |
| `authLimiter`               | 15 dk   | 5 istek    | `/auth/signup`, `/auth/login`                             |
| `verifyLimiter`             | 15 dk   | 1000 istek | `/auth/verify-token` (middleware tarafından sık çağrılır) |
| `healthCheckLimiter`        | 1 dk    | 60 istek   | `/health` uç noktaları                                    |
| `sensitiveOperationLimiter` | 1 saat  | 3 istek    | Hassas işlemler                                           |

## Middleware sırası

`app.js` içindeki gerçek sıra:

```javascript
app.use(securityHeaders); // Helmet
app.use(cookieSecurity);
app.use(generalLimiter);
app.use(cookieParser());
app.use(securityLogger);
app.use(session(/* ... */));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', routes);
app.use('/api/auth', authRoutes);
```

## Frontend entegrasyonu

Ek yapılandırma gerekmez — çerezler istekle otomatik gönderilir, `credentials`
ayarı axios istemcisinde zaten tanımlıdır. 401 yanıtındaki sessiz token yenileme
davranışı için [error-handling.md](./error-handling.md) içindeki interceptor
açıklamasına bakın.

## İlgili dokümanlar

- [Token temizliği ve yenileme token'ları](./token-cleanup.md)
- [Hata yönetimi ve sessiz token yenileme](./error-handling.md)
- [Organizasyon bağlamı güvenliği](./security.md)
