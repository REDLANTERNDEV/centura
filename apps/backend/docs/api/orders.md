# Orders ve Products API

Sipariş ve ürün yönetimi uç noktaları. İkisi ayrı route dosyalarında olsa da
(`orderRoutes.js`, `productRoutes.js`) iş akışları iç içe geçtiği için tek
dokümanda tutuluyor.

Tüm uç noktalar `verifyToken` ve `flexibleOrgContext` middleware'lerinden geçer —
davranışları için [security.md](../architecture/security.md) içindeki
`flexibleOrgContext` bölümüne bakın. Yanıt zarfı tutarlı biçimde
`{ success: boolean, data: ... }` veya hata durumunda
`{ success: false, message, errors? }` şeklindedir.

## Products

Tanım: [`routes/productRoutes.js`](../../src/routes/productRoutes.js),
[`controllers/productController.js`](../../src/controllers/productController.js)

| Method | Yol                            | Açıklama                              |
| ------ | ------------------------------ | ------------------------------------- |
| GET    | `/api/v1/products`             | Listele — filtreler aşağıda           |
| GET    | `/api/v1/products/low-stock`   | Eşiğin altındaki ürünler              |
| GET    | `/api/v1/products/:id`         | Tek ürün                              |
| POST   | `/api/v1/products`             | Oluştur                               |
| PUT    | `/api/v1/products/:id`         | Güncelle                              |
| PATCH  | `/api/v1/products/:id/stock`   | Stok ayarla                           |
| DELETE | `/api/v1/products/:id`         | Soft delete (`deleted_at` doldurulur) |
| POST   | `/api/v1/products/:id/restore` | Soft-delete'i geri al                 |

Liste sorgu parametreleri: `category`, `is_active`, `low_stock`, `min_price`,
`max_price`, `search` (ad/SKU/barkod), `page`, `limit`.

```json
// POST /api/v1/products
{
  "name": "Ürün Adı",
  "sku": "BENZERSIZ-SKU",
  "category": "Kategori",
  "unit": "pcs",
  "price": 99.99,
  "cost_price": 50.0,
  "tax_rate": 18.0,
  "stock_quantity": 100,
  "low_stock_threshold": 10
}
```

```json
// PATCH /api/v1/products/:id/stock
{ "quantity": 10, "type": "add" } // veya "subtract"
```

Soft delete kalıcı değildir: `deleted_at` doldurulur, ürün aktif listelerden
düşer ama geçmiş sipariş kalemlerindeki referansı bozulmaz (bkz.
[database.md](../architecture/database.md#order_items)). `restore` uç noktası
`deleted_at`'i temizler.

## Orders

Tanım: [`routes/orderRoutes.js`](../../src/routes/orderRoutes.js),
[`controllers/orderController.js`](../../src/controllers/orderController.js)

| Method | Yol                                   | Açıklama                                                                     |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/api/v1/orders`                      | Listele — filtreler aşağıda                                                  |
| GET    | `/api/v1/orders/statistics`           | Satış istatistikleri                                                         |
| GET    | `/api/v1/orders/top-products`         | En çok satan ürünler                                                         |
| GET    | `/api/v1/orders/customer/:customerId` | Bir müşterinin siparişleri                                                   |
| GET    | `/api/v1/orders/:id`                  | Tek sipariş, kalemleriyle birlikte                                           |
| POST   | `/api/v1/orders`                      | Oluştur                                                                      |
| PUT    | `/api/v1/orders/:id`                  | Tam güncelleme (`status`, `payment_status`, `paid_amount`, `notes`, `items`) |
| PATCH  | `/api/v1/orders/:id/status`           | Yalnızca durumu güncelle                                                     |
| PATCH  | `/api/v1/orders/:id/payment`          | Yalnızca ödeme durumunu güncelle                                             |
| PATCH  | `/api/v1/orders/:id/cancel`           | İptal et, stoğu geri yükle                                                   |
| DELETE | `/api/v1/orders/:id`                  | Sil, iptal edilmemişse stoğu geri yükle                                      |

Liste sorgu parametreleri: `status`, `payment_status`, `customer_id`,
`start_date`, `end_date`, `search` (sipariş no/müşteri), `page`, `limit`.

```json
// POST /api/v1/orders
{
  "customer_id": 1,
  "order_date": "2025-10-27T10:00:00Z",
  "expected_delivery_date": "2025-11-03T10:00:00Z",
  "shipping_address": "Adres",
  "shipping_city": "İstanbul",
  "discount_percentage": 10,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 99.99,
      "tax_rate": 18.0,
      "discount_amount": 10.0
    }
  ]
}
```

```json
// PATCH /api/v1/orders/:id/status
{ "status": "confirmed" }

// PATCH /api/v1/orders/:id/payment
{ "payment_status": "paid", "paid_amount": 1000.0 }
```

### Durum akışları

```
Sipariş durumu:  draft → confirmed → processing → shipped → delivered
                            ↓
                        cancelled  (delivered hariç her durumdan)

Ödeme durumu:    pending → partial → paid, ayrıca refunded
```

## Fiyat hesaplama

Hesaplama [`orderModel.js`](../../src/models/orderModel.js) içinde, sipariş
oluşturma sırasında bir veritabanı transaction'ı içinde yapılır:

```
kalem ara toplamı = quantity × unit_price
kalem vergisi      = (kalem ara toplamı − discount_amount) × (tax_rate / 100)
kalem toplamı       = kalem ara toplamı − discount_amount + kalem vergisi

sipariş indirimi    = discount_percentage > 0 ise (subtotal × discount_percentage / 100)
                       değilse doğrudan discount_amount
sipariş toplamı      = subtotal − sipariş indirimi + toplam vergi
```

### Bilinen sorun: `unit_price` boş bırakılırsa fiyat otomatik doldurulmaz

Bazı önceki dokümanlarda "`unit_price` verilmezse ürünün güncel fiyatı
kullanılır" denmişti — bu **doğru değil**. Doğrulayıcı (`orderValidator.js`),
`unit_price` alanını yalnızca _verilmişse_ tip kontrolünden geçirir, zorunlu
tutmaz. Ancak `orderModel.js`'deki hesaplama hiçbir geri düşüş yapmadan
doğrudan çarpar:

```javascript
const itemSubtotal = quantity * unit_price; // unit_price undefined ise NaN
```

Sonuç: `unit_price` olmadan gönderilen bir kalem, sessizce `NaN` toplamlarla bir
sipariş oluşturur — hata dönmez. Sipariş oluştururken `unit_price`'ı her zaman
açıkça gönderin.

## Stok yönetimi

- Sipariş oluşturulduğunda her kalem için stok `stock_quantity - quantity`
  olarak güncellenir.
- Yetersiz stok varsa `Error('Insufficient stock for product ...')` fırlatılır
  ve **tüm transaction geri alınır** (`ROLLBACK`) — kısmi sipariş oluşmaz.
- Sipariş iptal edilir veya silinirse (iptal edilmemiş durumdaysa), stok geri
  yüklenir.

## Sipariş numarası üretimi

Format: `ORD-{orgId}-{yıl}-{6 haneli sıra}`, örnek: `ORD-1-2025-000001`.

Sıra numarası, organizasyon başına ve yıl başına ayrıdır. Üretim sırasında
organizasyon satırı `SELECT ... FOR UPDATE` ile kilitlenir; bu, aynı anda
gelen iki sipariş isteğinin çakışıp aynı numarayı almasını engeller.

## Ürün anlık görüntüsü (snapshot)

`order_items.product_name` / `product_sku` / `product_category`, sipariş
oluşturulduğu andaki ürün bilgisinin kopyasıdır — canlı bir referans değildir.
Ürün daha sonra yeniden adlandırılsa, farklı bir kategoriye taşınsa veya soft
delete ile arşivlense bile geçmiş sipariş o günkü hâliyle okunabilir kalır.

## Analitik uç noktaları

```json
// GET /api/v1/orders/statistics?start_date=...&end_date=...
{
  "success": true,
  "data": {
    "total_orders": 150,
    "delivered_orders": 120,
    "cancelled_orders": 5,
    "paid_orders": 100,
    "total_revenue": 50000.0,
    "paid_revenue": 45000.0,
    "pending_revenue": 5000.0,
    "average_order_value": 333.33
  }
}
```

```json
// GET /api/v1/orders/top-products?start_date=...&end_date=...&limit=10
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Laptop",
      "sku": "LAP-001",
      "total_quantity": 50,
      "total_revenue": 25000.0,
      "order_count": 30
    }
  ]
}
```

Daha kapsamlı analitik (RFM, churn, DSO, envanter devir hızı) ayrı bir uç nokta
grubundadır — bkz. [insights.md](./insights.md).

## İlgili dokümanlar

- [Insights API](./insights.md)
- [Veritabanı şeması](../architecture/database.md)
- [Organizasyon bağlamı güvenliği](../architecture/security.md)
- [Backend validasyonu](../architecture/validation.md)
