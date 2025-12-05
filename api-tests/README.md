# 📁 Centura API - Bruno Koleksiyonu

Bu klasör, Centura CRM/ERP uygulaması için profesyonel Bruno API koleksiyonunu içerir.

## 📂 Klasör Yapısı

```text
api-tests/centura-api/
├── bruno.json                    # Koleksiyon yapılandırması
├── environments/                 # Ortam değişkenleri
│   ├── Development.bru          # Geliştirme ortamı
│   └── Production.bru           # Üretim ortamı
├── Auth/                        # Kimlik doğrulama uç noktaları
│   ├── Login.bru
│   ├── Signup.bru
│   └── Logout.bru
├── Products/                    # Ürün yönetimi (8 uç nokta)
│   ├── Get All Products.bru
│   ├── Get Product by ID.bru
│   ├── Create Product.bru
│   ├── Update Product.bru
│   ├── Update Stock - Add.bru
│   ├── Update Stock - Subtract.bru
│   ├── Get Low Stock Products.bru
│   └── Delete Product.bru
├── Orders/                      # Sipariş yönetimi (8 uç nokta)
│   ├── Get All Orders.bru
│   ├── Get Order by ID.bru
│   ├── Create Order.bru
│   ├── Create Order - Auto Pricing.bru
│   ├── Update Order Status.bru
│   ├── Update Payment Status.bru
│   ├── Cancel Order.bru
│   └── Delete Order.bru
├── Analytics/                   # Satış analitikleri (3 uç nokta)
│   ├── Sales Statistics.bru
│   ├── Top Selling Products.bru
│   └── Customer Orders.bru
└── Customers/                   # Müşteri yönetimi
    ├── Get All Customers.bru
    └── Create Customer.bru
```

## 🚀 Kullanım

### 1. Bruno'yu İndir ve Kur

İndir: <https://www.usebruno.com/>

### 2. Koleksiyonu Aç

1. Bruno'yu başlat
2. **"Open Collection"** düğmesine tıkla
3. `api-tests/centura-api` klasörünü seç

### 3. Ortamı Seç

Sağ üst köşeden **Geliştirme** veya **Üretim** ortamını seç.

**Önemli:** Proje klonladıktan sonra veya backend portu değiştiyse, ortamı senkronize et:

```bash
# Bruno ortamını backend .env PORT ile senkronize et
npm run sync:bruno
```

Bu, Bruno'nun `baseUrl`'sinin backend sunucusu portuna otomatik olarak uyması sağlar!

### 4. Token'ı Ayarla

#### Yöntem 1: Login İsteğinden Token Al

1. `Auth > Login` isteğini çalıştır
2. Yanıttan cookie değerini kopyala
3. Ortama kaydet:
   - Sağ üst → Environment settings
   - `token` değişkenine yapıştır

#### Yöntem 2: Tarayıcıdan Token Al

1. Web uygulamasına giriş yap
2. Developer Tools → Application → Cookies
3. `token` cookie değerini kopyala
4. Ortama kaydet

### 5. İstekleri Çalıştır

Her klasördeki istekleri sırayla test edebilirsin!

## 🎯 Test Senaryosu

### Tam İş Akışı

1. **Auth/Login** → Token al
2. **Customers/Create Customer** → Müşteri oluştur
3. **Products/Create Product** → Ürünler oluştur (birden fazla)
4. **Orders/Create Order** → Sipariş oluştur
5. **Orders/Update Order Status** → onaylı yap
6. **Orders/Update Payment Status** → ödendi yap
7. **Analytics/Sales Statistics** → İstatistikleri görüntüle
8. **Analytics/Top Selling Products** → En çok satılan ürünler

## 🔧 Ortam Değişkenleri

### Geliştirme

**Otomatik Senkronizasyon Mevcut!** Backend `.env` dosyası ile otomatik senkronizasyon için `npm run sync:bruno` çalıştır.

```env
baseUrl: http://localhost:8765/api/v1  # Backend PORT'tan otomatik senkronize
token: [Login sonrası token burada olacak]
```

**Nasıl çalışır:**

1. Backend `.env`'de `PORT=8765` var
2. `npm run sync:bruno` çalıştır
3. Bruno `Development.bru` otomatik olarak `baseUrl` günceller

**Manuel senkronizasyon:** Backend `.env`'deki port değişirse, her zaman çalıştır:

```bash
npm run sync:bruno
```

### Üretim

```env
baseUrl: https://centuraapi.example.com/api/v1
token: [Üretim token'ı]
```

## 💡 İpuçları

### Sorgu Parametreleri

Devre dışı bırakılan parametreler (`~` öneki olanlar) varsayılan olarak gönderilmez. Etkinleştirmek için `~` kaldır.

Örnek:

```text
params:query {
  page: 1                     # Aktif
  limit: 50                   # Aktif
  ~category: Electronics      # Devre dışı
}
```

### İstek Sırası

Her isteğin bir `seq` numarası vardır. Bruno onları sırayla gösterir.

### Dokümantasyon

Her isteğin bir `docs` bölümü vardır. Ayrıntılı açıklamalar için isteği aç.

## 📊 Özellikler

### Otomatik İşlemler

- ✅ Sipariş oluşturulduğunda stok otomatik azalır
- ✅ Sipariş iptal edildiğinde stok otomatik eski haline gelir
- ✅ Toplam tutarlar otomatik hesaplanır
- ✅ Sipariş numarası otomatik oluşturulur (ORD2025000001)

### İş Akışları

**Sipariş Durumu:**

```text
taslak → onaylı → işlenmesi → gönderimi → teslim edildi
           ↓
       iptal edildi (her zaman, teslim edildi hariç)
```

**Ödeme Durumu:**

```text
beklemede → kısmi → ödendi → iade
```

## 🔍 Filtre Örnekleri

### Ürünler

- Kategoriye göre: `?category=Electronics`
- Fiyat aralığı: `?min_price=100&max_price=500`
- Düşük stok: `?low_stock=true`
- Arama: `?search=laptop`

### Siparişler

- Duruma göre: `?status=confirmed`
- Ödeme durumu: `?payment_status=paid`
- Tarih aralığı: `?start_date=2025-10-01&end_date=2025-10-31`
- Müşteriye göre: `?customer_id=1`

### Müşteriler

- Şehre göre: `?city=Istanbul`
- Segmente göre: `?segment=Premium`
- Arama: `?search=acme`

## 🛠️ Sorun Giderme

### 401 Yetkisiz

- Token'ın doğru olduğundan emin ol
- Token 15 dakika içinde sona erer, tekrar giriş yap
- Token değişkeninin ortamda ayarlanıp ayarlanmadığını kontrol et

### 404 Bulunamadı

- Backend sunucusunun çalışıp çalışmadığını kontrol et
- Port numarasının backend ile eşleştiğini doğrula (gerekirse `npm run sync:bruno` çalıştır)
- Uç nokta URL'sinin doğru olduğunu doğrula

### ECONNREFUSED

- Backend sunucusunu başlat: `npm start` veya `npm run dev:backend`
- Doğru portun kullanılıp kullanılmadığını kontrol et
- **`npm run sync:bruno` çalıştır** Bruno'nun doğru portu kullandığından emin olmak için
- Portun başka bir uygulama tarafından kullanılıp kullanılmadığını kontrol et

## 📚 Daha Fazla Bilgi

- **API Dokümantasyonu**: `apps/backend/docs/ORDERS_API_GUIDE.md`
- **Veritabanı Şeması**: `apps/backend/docs/DATABASE.md`

---

**🎉 Hazırsın!** Bruno ile API'nini test etmeye başla! 🚀
