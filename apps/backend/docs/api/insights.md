# Insights API

İş zekası ve analitik uç noktaları. Tanım:
[`routes/insightsRoutes.js`](../../src/routes/insightsRoutes.js),
[`controllers/insightsController.js`](../../src/controllers/insightsController.js),
[`models/insightsModel.js`](../../src/models/insightsModel.js)

> Bu dosya, önceden ayrı bulunan bir kapsamlı rehber ile bir özet dokümanını
> birleştirir.

## Genel kurallar

- Tüm rotalar `router.use(verifyToken)` ve `router.use(validateOrgContext)`
  ile korunur — `insights` rotaları, sipariş/ürün rotalarının aksine
  **`flexibleOrgContext` değil, `validateOrgContext` kullanır**: `X-Organization-ID`
  başlığı yoksa JWT'ye düşmez, doğrudan 400 döner. Bkz.
  [security.md](../architecture/security.md#üç-middleware-tek-amaç).
- Tarih aralığı parametreleri **`startDate`/`endDate`** (camelCase) —
  Orders/Products API'sindeki `start_date`/`end_date` (snake_case) ile
  **tutarsızdır**. Bir istemci yazıyorsanız hangi API'yi çağırdığınıza göre
  doğru biçimi kullanın.
- Başarılı yanıt zarfı `{ success: true, data: ... }`; hata zarfı
  `{ success: false, error: "..." }` — Orders/Organizations API'lerinin
  `message` alanından farklı olarak burada `error` kullanılır.
- Organizasyon seçili değilse (`req.organization?.id` boşsa) tüm uç noktalar
  `400 { success: false, error: 'No organization selected' }` döner.

## Uç nokta listesi

| Yol                                           | Parametreler                                  | Açıklama                                           |
| --------------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| `GET /api/v1/insights`                        | `startDate`, `endDate`, `compareWithPrevious` | Tüm analitiği tek istekte döner                    |
| `GET /api/v1/insights/customers/top`          | `startDate`, `endDate`, `limit`               | Gelire göre en iyi müşteriler                      |
| `GET /api/v1/insights/customers/segments`     | `startDate`, `endDate`                        | Segment bazlı müşteri analizi                      |
| `GET /api/v1/insights/customers/retention`    | `days` (varsayılan 30)                        | Müşteri elde tutma oranı                           |
| `GET /api/v1/insights/customers/churn`        | `days` (varsayılan 90)                        | Müşteri kayıp oranı                                |
| `GET /api/v1/insights/customers/rfm`          | —                                             | RFM segmentasyonu — **bkz. bilinen sorun aşağıda** |
| `GET /api/v1/insights/sales/monthly`          | `startDate`, `endDate`                        | Aylık satış trendi                                 |
| `GET /api/v1/insights/products/top`           | `startDate`, `endDate`, `limit`               | En çok satan ürünler                               |
| `GET /api/v1/insights/categories/performance` | `startDate`, `endDate`                        | Kategori bazlı performans                          |
| `GET /api/v1/insights/revenue/metrics`        | `startDate`, `endDate`                        | Gelir, vergi, indirim toplamları                   |
| `GET /api/v1/insights/revenue/gross-margin`   | `startDate`, `endDate`                        | Brüt kâr marjı                                     |
| `GET /api/v1/insights/payments/analysis`      | `startDate`, `endDate`                        | Ödeme yöntemi dağılımı                             |
| `GET /api/v1/insights/payments/dso`           | `startDate`, `endDate`                        | Days Sales Outstanding (tahsilat süresi)           |
| `GET /api/v1/insights/orders/metrics`         | `startDate`, `endDate`                        | Sipariş durumu ve gerçekleşme metrikleri           |
| `GET /api/v1/insights/inventory/health`       | —                                             | Stok sağlığı                                       |
| `GET /api/v1/insights/inventory/turnover`     | `startDate`, `endDate`                        | Stok devir hızı                                    |
| `GET /api/v1/insights/growth/metrics`         | —                                             | Aydan aya (MoM) büyüme                             |

## Kapsamlı gösterge paneli

```
GET /api/v1/insights?startDate=2025-01-01&endDate=2025-12-31
```

Tek istekte tüm kategorileri döner — `salesPerformance`, `customerAnalytics`,
`revenueAnalytics`, `orderAnalytics`, `inventoryInsights`, `growthMetrics`,
`paymentAnalysis` alt nesneleri altında. Dashboard sayfası bu uç noktayı
kullanır; tek bir kartlık veri için ilgili özel uç noktayı çağırmak daha
hafiftir.

## RFM segmentasyonu

```
GET /api/v1/insights/customers/rfm
```

Recency (son sipariş üzerinden geçen gün), Frequency (sipariş sayısı) ve
Monetary (toplam harcama) değerlerine göre her müşteriye 1–5 arası quintile
skoru verir ve bunları isimlendirilmiş segmentlere ayırır (`Champions`,
`Loyal Customers`, `At Risk`, `Hibernating`, vb.).

```json
{
  "success": true,
  "data": {
    "totalCustomers": 42,
    "segments": [
      {
        "segment": "Champions",
        "count": 8,
        "percentage": "19.05",
        "avgRecency": "3.20",
        "avgFrequency": "6.10",
        "avgMonetary": "4200.00"
      }
    ],
    "customers": [
      {
        "customerId": 1,
        "recency": 3,
        "frequency": 6,
        "monetary": 4200,
        "rScore": 5,
        "fScore": 5,
        "mScore": 5,
        "rfmScore": "555",
        "segment": "Champions"
      }
    ]
  }
}
```

### Bilinen sorun (çözüldü — sunucunuzda henüz uygulanmamış olabilir)

`insightsModel.getRFMAnalysis()`, veritabanı fonksiyonu `calculate_rfm_scores(org_id)`'yi
çağırır. Bu fonksiyon önceden şemada **tanımlı değildi** ve bu uç nokta
`init-schema.sql`'den kurulmuş bir veritabanında hata verirdi. Fonksiyon artık
[`init-schema.sql`](../../scripts/init-schema.sql) içine eklendi ve gerçek
verilerle test edildi. **Ancak `init-schema.sql` yalnızca veritabanı ilk kez
oluşturulurken çalışır** — daha önce kurulmuş bir production veritabanında bu
fonksiyonu elle eklemeniz gerekir:

```bash
docker compose exec -T postgres psql -U postgres -d "$DB_NAME" \
  -c "$(sed -n '/CREATE OR REPLACE FUNCTION calculate_rfm_scores/,/LANGUAGE plpgsql STABLE;/p' apps/backend/scripts/init-schema.sql)"
```

## Elde tutma ve kayıp oranı

```
GET /api/v1/insights/customers/retention?days=30
GET /api/v1/insights/customers/churn?days=90
```

Pencere boyutu, gün cinsinden `days` parametresiyle ayarlanır — diğer
uç noktaların `startDate`/`endDate` çiftinden farklı olarak tek bir sayı
alır.

## Ödeme analizi

```
GET /api/v1/insights/payments/dso
```

DSO (Days Sales Outstanding), ortalama tahsilat süresini gösterir — düşük
değer daha hızlı tahsilat anlamına gelir. `payments/analysis` uç noktası
ödeme yöntemi dağılımını ve bekleyen/gecikmiş tutarları döner.

## Envanter

```
GET /api/v1/insights/inventory/health
GET /api/v1/insights/inventory/turnover?startDate=...&endDate=...
```

`inventory/health`, `low_stock_threshold` altındaki ürünleri ve genel stok
durumunu özetler; tarih aralığı almaz. `inventory/turnover`, belirli bir
dönemdeki stok devir hızını hesaplar.

## Büyüme metrikleri

```
GET /api/v1/insights/growth/metrics
```

Aydan aya (month-over-month) gelir ve sipariş hacmi değişimini döner; tarih
aralığı parametresi almaz — her zaman güncel ay ile bir önceki ayı
karşılaştırır.

## İlgili dokümanlar

- [Orders ve Products API](./orders.md)
- [Veritabanı şeması](../architecture/database.md)
- [Organizasyon bağlamı güvenliği](../architecture/security.md)
