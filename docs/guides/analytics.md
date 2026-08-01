# Analitik gösterge paneli

Route: `/dashboard/analytics`
([`page.tsx`](<../../apps/frontend/app/(dashboard)/dashboard/analytics/page.tsx>),
1.577 satır). shadcn/ui ve Recharts ile kurulmuş beş sekme: Genel Bakış,
Gelir, Satış, Müşteriler, Stok.

> Bu dosya, aynı özelliği çelişkili ve kısmen uydurma ayrıntılarla anlatan iki
> eski dokümanın yerine geçer — bunlardan biri gerçek şemayla uyuşmayan
> tablolar, trigger'lar ve bir RFM fonksiyonu tanımlayan bir "Backend
> Implementation" bölümü içeriyordu. Aşağıdaki her şey gerçek kodla
> karşılaştırılarak doğrulanmıştır.

## Kozmetik olmayan iki gerçek hata

**Zaman aralığı seçicisinin hiçbir etkisi yok.** Sayfa
`GET /insights?period=30d` gönderiyor (`period` değerleri: `7d`, `30d`, `90d`,
`ytd`, `all`). Backend'in `getInsights` kontrolcüsü ise sorgu dizesinden
`startDate`, `endDate` ve `compareWithPrevious` okuyor —
`insightsController.js` içinde hiçbir yerde `period` parametresi yok.
Açılır menüdeki her değer, backend'in sessizce yok saydığı bir sorgu
gönderiyor; yani dönem değiştirmenin hiçbir etkisi yok, gösterge paneli her
zaman backend'in varsayılan aralığını gösteriyor. Bunu düzeltmek için ya
frontend seçilen dönemden `startDate`/`endDate` hesaplamalı, ya da backend
`period` işlemeyi eklemeli — şu anki gibi ikisi birbirinden bağımsız
sürüklenmemeli.

**Herhangi bir hata, gerçekmiş gibi sessizce sahte veri gösteriyor, hiçbir
uyarı yok.** `fetchAnalytics()` içinde:

```typescript
} catch {
  // Use mock data for development if API is not available
  setAnalyticsData(getMockAnalyticsData());
  setError(null); // Clear error since we're using mock data
}
```

Yorum "for development" (geliştirme için) diyor, ama hiçbir `NODE_ENV`
kontrolü veya başka bir kapı yok — bu kod production'da da birebir aynı
şekilde çalışıyor. API isteği herhangi bir nedenle başarısız olursa (ağ
hatası, 500, backend çökmüş, oturum süresi dolmuş), gösterge paneli
`getMockAnalyticsData()`'nın uydurma sayılarıyla doluyor ve hata durumunu
bilinçli olarak temizliyor — arayüzde verinin gerçek olmadığına dair hiçbir
işaret kalmıyor. Biri, tamamen uydurma bir gelir grafiğine bakarak hiçbir
uyarı almadan iş kararı alabilir. Bu dokümantasyon geçişinden çıkan en
öncelikli düzeltme budur — nasıl işaretlendiğini görmek için [ana
README](../../README.md)'nin sonundaki nota bakın.

## Sekmeler

| Sekme       | Gösterdiği                                                              |
| ----------- | ----------------------------------------------------------------------- |
| Genel Bakış | Aylık satış (çift eksen), sipariş durumu dağılımı, en çok satan ürünler |
| Gelir       | Toplam/dönem geliri, büyüme oranı, duruma göre gelir                    |
| Satış       | Kategori performansı, aylık trend, gelire göre en çok satan ürünler     |
| Müşteriler  | Toplamlar, elde tutma, segmentasyon, en iyi müşteriler                  |
| Stok        | Ürün sayısı, düşük/tükenen stok sayısı, stok sağlığı                    |

## Veri akışı

```
page.tsx
  → apiClient.get('/insights', { params: { period } })   ← period backend'de yok sayılıyor, yukarıya bakın
  → transformBackendData(response.data.data)               ← gerçek API yanıtını yeniden şekillendirir
  → AnalyticsData (frontend'e özel tip)
  → 5 sekmede render edilir
```

`transformBackendData`, backend'in gerçek yanıt şeklini — `revenueAnalytics`,
`customerAnalytics`, `salesPerformance`, `orderAnalytics`, `growthMetrics`
(bkz. [insights.md](../../apps/backend/docs/api/insights.md)) —
frontend'in kendi `AnalyticsData` arayüzüne eşler. Eşleme savunmacı bir
yaklaşımla yazılmış, birden fazla olası alan adı varyantını kontrol ediyor
(`customer.totalSales || customer.total_revenue || customer.totalRevenue`);
bu da backend yanıt şeklinin en az bir kez değiştiğini, ancak frontend'in tam
olarak buna göre güncellenmediğini düşündürüyor.

Gerçek API yanıt alanları, sorgu parametreleri ve bilinen backend sorunları
için (bu dokümantasyon geçişine kadar eksik olan RFM fonksiyonu dâhil — bkz.
[insights.md](../../apps/backend/docs/api/insights.md#rfm-segmentasyonu))
doğrudan backend dokümanlarına bakın — bu referansı burada tekrarlamak, zaten
eski dokümanların sürüklenmesine yol açan şeyin ta kendisi.

## Bileşenler

| Konum                                                                                                              | İçerik                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [`components/analytics/AnalyticsComponents.tsx`](../../apps/frontend/components/analytics/AnalyticsComponents.tsx) | `MetricCard`, `EmptyState`, `StatBadge`, `ProgressBar`                                                                |
| [`lib/analytics-utils.ts`](../../apps/frontend/lib/analytics-utils.ts)                                             | `exportToCSV`/`exportToJSON`, biçimlendiriciler, `calculateGrowthRate`, `calculateMovingAverage`, `getTrendDirection` |

`page.tsx`, `analytics-utils.ts` içindeki karşılıklarından bağımsız olarak
kendi `formatCurrency`/`formatPercentage`/`formatNumber` fonksiyonlarını da
tanımlıyor — aynı biçimlendirmenin iki ayrı uygulaması yan yana duruyor.

## Test etme

1. Bir organizasyonun seçili olduğundan emin olun.
2. Backend'i durdurun ve sayfayı yeniden yükleyin — tamamen dolu bir gösterge
   paneli değil, bir hata görmelisiniz. Grafik ve sayılar görüyorsanız
   yukarıdaki mock-veri hatasına yakalanmışsınızdır.
3. Zaman dönemlerini değiştirip network sekmesini kontrol edin — istek her
   zaman aynı `period` değeri kalıbıyla gidiyor, beklediğiniz gerçek tarih
   aralığından bağımsız olarak; bu bir arayüz aksaklığı değil, yok sayılan
   parametre hatasıdır.

## İlgili dokümanlar

- [Insights API](../../apps/backend/docs/api/insights.md)
- [Veritabanı şeması](../../apps/backend/docs/architecture/database.md)
- [Ürünler sayfası](<../../apps/frontend/app/(dashboard)/dashboard/products/README.md>)
