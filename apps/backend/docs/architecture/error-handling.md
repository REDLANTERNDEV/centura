# Hata Yönetimi ve Sessiz Token Yenileme

> **Not:** Bu doküman ağırlıklı olarak **frontend** davranışını anlatır; backend
> dokümanları altında durması tarihsel bir kalıntıdır. İlgili kod
> [`apps/frontend/lib/api-client.ts`](../../../frontend/lib/api-client.ts)
> içindedir.

## Backend hata biçimi

Backend, hataları tek bir alanla döndürür:

```json
{ "error": "Invalid credentials" }
```

## Axios yanıt interceptor'ı

`api-client.ts` içindeki yanıt interceptor'ı iki iş yapar: hata mesajını
normalleştirir ve süresi dolmuş erişim token'larını kullanıcıya hissettirmeden
yeniler.

### 1. Hata mesajının çıkarılması

Sırayla şu alanlara bakılır ve ilk dolu olan kullanılır:

```ts
const message =
  error.response?.data?.error || // backend'in standart alanı
  error.response?.data?.message || // alternatif alan
  error.message || // axios'un kendi mesajı
  'An error occurred'; // son çare
```

Böylece çağıran taraf, hatanın nereden geldiğine bakmadan tek bir `Error` nesnesi
alır ve bunu doğrudan toast bileşenine verebilir.

### 2. 401 durumunda sessiz yenileme

Bir istek `401` dönerse interceptor, kullanıcıyı çıkışa göndermek yerine önce
erişim token'ını yenilemeyi dener.

Yenileme yalnızca şu koşullarda denenir:

- Yanıt kodu `401` ise,
- Bu istek daha önce yeniden denenmemişse (`_retry` bayrağı),
- İsteğin kendisi `refresh-token` veya `login` uç noktası değilse.

Son iki koşul sonsuz döngüyü engeller: yenileme isteğinin kendisi 401 dönerse
tekrar yenileme denenmez.

### 3. Eşzamanlı isteklerin kuyruğa alınması

Sayfa aynı anda birden fazla istek atıyorsa ve token süresi dolmuşsa, hepsinin ayrı
ayrı yenileme çağrısı yapması istenmez. Interceptor bunu `isRefreshing` bayrağı ve
`failedQueue` kuyruğuyla çözer:

- İlk 401 alan istek yenilemeyi başlatır.
- Bu sırada 401 alan diğer istekler kuyruğa eklenir ve bekler.
- Yenileme başarılıysa kuyruk boşaltılır ve **tüm** bekleyen istekler tekrar
  gönderilir.

Yani kaç istek beklemede olursa olsun, tek bir yenileme çağrısı yapılır.

### 4. Yenileme başarısız olursa

Yenileme de başarısız olursa oturum gerçekten bitmiştir. Bu durumda:

1. Kuyruktaki istekler `Session expired` hatasıyla reddedilir,
2. `localStorage` içindeki `centura_selected_org_id` temizlenir,
3. Tarayıcı ortamındaysa giriş sayfasına yönlendirilir.

Organizasyon seçiminin temizlenmesi önemlidir: aksi hâlde farklı bir hesapla giriş
yapan kullanıcı, önceki kullanıcının organizasyon seçimiyle açılırdı.

## Kullanıcıya gösterim

Sayfa tarafında interceptor'ın ürettiği mesaj yakalanıp toast olarak gösterilir:

```ts
try {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  toast.success('Giriş başarılı!');
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Giriş başarısız oldu';
  toast.error(message);
}
```

Bileşenlerin hata gövdesini ayrıştırması gerekmez; interceptor bunu zaten
normalleştirmiştir.

## Beklenmedik çıkışlar

Kullanıcılar oturumdan düştüğünde suçlu genellikle frontend değildir. Backend'in
yenileme token'ı doğrulama sorgusunda, aktif token sayısı 100'ü aştığında geçerli
token'ların doğrulanamadığı bilinen bir sorun vardır. Bu durumda yenileme başarısız
olur ve yukarıdaki 4. adım devreye girerek kullanıcıyı giriş sayfasına gönderir.

Ayrıntı için [token-cleanup.md](./token-cleanup.md) içindeki "Bilinen sorun"
bölümüne bakın.

## İlgili dokümanlar

- [Token temizliği ve yenileme token'ları](./token-cleanup.md)
- [HTTP-only çerezler](./http-only-cookies.md)
- [Veritabanı şeması](./database.md)
