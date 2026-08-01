# Token Temizliği

Süresi dolmuş ve iptal edilmiş yenileme token'ları, arka planda çalışan zamanlanmış
bir görevle veritabanından silinir. Elle çalıştırılacak bir betik veya sistem
seviyesinde cron kaydı gerekmez.

## Nasıl çalışır

Servis: [`src/services/tokenCleanupService.js`](../../src/services/tokenCleanupService.js)
Başlatıldığı yer: [`server.js`](../../server.js)

```js
tokenCleanupService.startAutoCleanup();
```

Sunucu ayağa kalktığında:

1. Bir kez hemen temizlik yapılır.
2. Ardından `node-cron` ile her saat başı (`0 * * * *`) tekrarlanır.

Servis tekil (singleton) bir örnektir ve `isRunning` bayrağıyla çakışan
çalıştırmaları engeller: önceki temizlik bitmeden yenisi başlamaz.

## Ne siliniyor

`userModel.deleteExpiredTokens()` tek bir sorgu çalıştırır:

```sql
DELETE FROM refresh_tokens
WHERE expires_at < NOW() OR is_revoked = TRUE
```

Yani süresi dolmuş **veya** iptal edilmiş kayıtlar kalıcı olarak silinir. Çıkış
yapıldığında ve token rotasyonunda kayıtlar `is_revoked = TRUE` işaretlendiği için,
bu satırlar bir sonraki temizlikte tablodan düşer.

## Günlük kaydı

Silinecek kayıt varsa tek satırlık bir log yazılır:

```
🧹 Auto-cleaned 15 expired tokens
```

Silinecek kayıt yoksa hiçbir şey yazılmaz — logların sessiz kalması normaldir.
Hata durumunda temizlik sessizce yutulmaz, `console.error` ile raporlanır ve servis
bir sonraki saatte yeniden dener.

## Token'lar nasıl saklanıyor

Yenileme token'ının kendisi veritabanında tutulmaz. `refresh_tokens.token_hash`
sütununda **argon2id** ile hashlenmiş hâli saklanır
([`userModel.js`](../../src/models/userModel.js)).

Doğrulama sırasında aday satırlar çekilir ve her biri için `argon2.verify()`
çalıştırılır.

## Bilinen sorun: token doğrulama sorgusu ölçeklenmiyor

`validateRefreshToken` ve eşdeğeri sorgu, doğrulanacak token'ı **kullanıcıya göre
daraltmadan** çeker:

```sql
SELECT ... FROM refresh_tokens rt
JOIN users u ON rt.user_id = u.id
WHERE rt.expires_at > NOW() AND rt.is_revoked = FALSE
ORDER BY rt.last_used_at DESC NULLS LAST, rt.created_at DESC
LIMIT 100
```

Sonra dönen satırların her biri için sırayla `argon2.verify()` çağrılır. Bunun iki
sonucu var:

1. **Sistem genelinde 100'den fazla aktif token olduğunda oturumlar kopar.**
   Sorgu `last_used_at` sırasına göre yalnızca ilk 100 kaydı alır. Uzun süredir
   kullanılmayan geçerli bir token bu listeye giremezse doğrulama başarısız olur ve
   kullanıcı — token'ı hâlâ geçerli olmasına rağmen — oturumdan düşer.

2. **Her yenileme isteği en fazla 100 argon2id doğrulaması yapar.** argon2id
   kasıtlı olarak yavaştır; bu, istek başına ciddi CPU maliyeti ve bir hizmet
   engelleme (DoS) yüzeyi anlamına gelir.

Yenileme token'ları `jwt.sign()` ile üretildiği ve `userId` alanını taşıdığı için,
sorgu token'ın içindeki kullanıcıya göre daraltılabilir
(`WHERE rt.user_id = $1`); bu, doğrulama sayısını o kullanıcının birkaç aktif
oturumuna indirir.

Daha kalıcı çözüm, yenileme token'larını argon2 yerine SHA-256 ile hashlemektir:
token zaten yüksek entropili ve imzalı olduğu için yavaş bir KDF'e ihtiyaç yoktur ve
deterministik hash sayesinde kayıt indeks üzerinden doğrudan bulunabilir. argon2,
düşük entropili sırlar (parolalar) için tasarlanmıştır.

## Devre dışı bırakma

Önerilmez; devre dışı bırakılırsa `refresh_tokens` tablosu sınırsız büyür ve
yukarıdaki `LIMIT 100` sorunu daha hızlı ortaya çıkar. Yine de gerekiyorsa
`server.js` içindeki `startAutoCleanup()` çağrısını kaldırmak yeterlidir.

## İlgili dokümanlar

- [Veritabanı şeması](./database.md) — `refresh_tokens` tablosu ve token ailesi modeli
- [HTTP-only çerezler](./http-only-cookies.md)
- [Güvenlik](./security.md)
