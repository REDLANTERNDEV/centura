# Centura CRM

> Müşteri İlişkileri Yönetim Platformu - ERP Ekosisteminin Kalbi

Centura, kurumsal ERP sistemlerinin müşteri ilişkileri yönetimi (CRM) modülüdür. Müşteri yaşam döngüsünün tüm aşamalarını yönetirken, satış, iletişim, analitik ve envanter entegrasyonuyla güçlü bir iş çözümü sunar. Çok kiracılı SaaS mimarisine dayalı Centura, ölçeklenebilir ve güvenli bir müşteri yönetim deneyimi sağlar.

---

## 🎯 CRM Özellikleri

### 👥 Müşteri Yönetimi (Core CRM)

- **Müşteri Profilleri** - Tüm müşteri bilgilerini merkezi bir yerde tutun
- **İletişim Geçmişi** - Email, telefon ve notlar otomatik olarak takip edin
- **Satış Fırsat Yönetimi** - Pipeline'ınızı görselleştirin ve fırsat takibi yapın
- **Müşteri Segmentasyonu** - Müşteri davranışına göre otomatik kategorilendirme
- **Müşteri İstatistikleri** - Sipariş geçmişi, toplam harcama, son etkileşim

### 📊 Analitik & İçgörüler (CRM Analytics)

- **Gerçek zamanlı satış istatistikleri** - Günlük, aylık ve yıllık trend analizi
- **Müşteri davranış analizi** - En değerli müşterileri belirleyin
- **Satış performans raporları** - Konuya göre satış metrikleri
- **Envanter sağlığı takibi** - Stok seviyeleri ve yeniden sipariş uyarıları
- **Aylık büyüme metrikleri** - MoM (Aylık) değişim oranları

### 🛒 Satış Yönetimi (ERP Entegrasyonu)

- **Sipariş Yönetimi** - CRM'den doğrudan sipariş oluşturun ve takip edin
- **Dinamik Ürün Kataloğu** - Müşteri segmentine göre ürün önerileri
- **Satış Döngüsü Otomasyonu** - Lead'den müşteriye dönüşüm pipeline'ı
- **Ödeme ve Kargo Takibi** - Sipariş fulfillment otomasyonu

### 📦 Envanter Entegrasyonu (ERP Modülü)

- **Stok Düzeylerinin İzlenmesi** - Müşteri siparişleriyle senkronize stok
- **Düşük Stok Uyarıları** - Otomatik yeniden sipariş tetikleyicileri
- **Ürün Kategorilendirmesi** - Müşteri segmentasyonuyla ilişkili kategoriler
- **Tedarikçi Yönetimi** - Satın alma ve tedarikçi entegrasyonu

### 🔐 Güvenlik & Uyum

- Rol tabanlı erişim kontrolü (RBAC)
- Şifreli veri depolama
- Oturum yönetimi
- Denetim günlükleri

---

## 📸 Ekran Görüntüleri

### Müşteri Dashboard

![Customer Dashboard](./docs/screenshots/01-dashboard.png)
_Müşteri CRM merkezi - tüm müşteri metrikleri ve aktiviteleri bir bakışta_

### Müşteri Yönetimi & İletişim Geçmişi

![Customer Management](./docs/screenshots/02-customers.png)
_Detaylı müşteri profilleri, iletişim geçmişi ve satış aktiviteleri_

### Satış Analitikleri & Raporlar

![Sales Analytics](./docs/screenshots/03-sales-analytics.png)
_CRM analytics - satış trend'leri, müşteri segmentasyonu ve performans metrikleri_

### Satış Sipariş Yönetimi

![Orders Management](./docs/screenshots/04-orders.png)
_Müşteri siparişlerini yönetin, ödeme ve kargo takibi yapın_

### Envanter & Ürün Katalog

![Inventory Management](./docs/screenshots/05-inventory.png)
_ERP entegrasyonu - stok seviyelerini gerçek zamanlı takip edin_

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (Önerilir)

### Kurulum

#### Docker ile (Önerilen)

```bash
# Repository'yi klonlayın
git clone https://github.com/REDLANTERNDEV/centura.git
cd centura

# Ortam değişkenlerini ayarlayın
cp .env.example .env

# Development ortamında çalıştırın
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Uygulamaya erişin
# Frontend: http://localhost:3000
# Backend API: http://localhost:8765/api/v1
# Health Check: http://localhost:8765/api/v1/health
```

#### Manuel Kurulum

```bash
# Repository'yi klonlayın
git clone https://github.com/REDLANTERNDEV/centura.git
cd centura

# Bağımlılıkları yükleyin
npm install

# Backend başlatın
cd apps/backend
npm run dev

# Yeni bir terminal'de Frontend başlatın
cd apps/frontend
npm run dev

# Uygulamaya erişin
# Frontend: http://localhost:3000
# Backend API: http://localhost:8765
```

---

## 📋 Proje Yapısı

```
centura/
├── 📱 apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/        # Yapılandırma dosyaları
│   │   │   ├── controllers/   # İstek işleyicileri
│   │   │   ├── middleware/    # Kimlik doğrulama, güvenlik
│   │   │   ├── models/        # Veritabanı şemaları
│   │   │   ├── routes/        # API uç noktaları
│   │   │   ├── services/      # İş mantığı
│   │   │   └── validators/    # Girdi doğrulaması
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/
│       ├── app/               # Next.js uygulama
│       ├── components/        # React bileşenleri
│       ├── hooks/            # Özel React hook'ları
│       ├── lib/              # Yardımcı fonksiyonlar
│       ├── public/           # Statik dosyalar
│       ├── Dockerfile
│       └── package.json
│
├── 🐘 docs/
│   ├── docker/              # Docker yapılandırması
|   ├── guides/              # Projedeki bazı modüllerin yapısı
│
├── 🔧 scripts/
│   ├── docker-setup.sh      # Docker otomasyonu
│   └── backup-db.sh         # Veritabanı yedeklemesi
│
├── docker-compose.yml       # Üretim yapılandırması
├── docker-compose.dev.yml   # Geliştirme yapılandırması
└── package.json            # Workspace tanımı
```

---

## 🛠️ Teknoloji Stack'i

### Frontend

- **Next.js 16** - React SSR framework
- **React 19** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Recharts** - Grafikler ve istatistikler
- **Radix UI** - Erişilebilir bileşenler

### Backend

- **Express.js** - API sunucusu
- **Node.js** - Runtime
- **PostgreSQL** - İlişkisel veritabanı
- **JWT** - Kimlik doğrulama
- **Argon2** - Parola şifreleme

### DevOps

- **Docker** - Konteynerizasyon
- **Docker Compose** - Multi-container orkestrasyon
- **Nginx** - Reverse proxy

---

## 🔐 Güvenlik Özellikleri

✅ **Kimlik Doğrulama**

- JWT tabanlı token yönetimi
- Güvenli oturum yönetimi
- Çıkış fonksiyonu ve token geçersiz kılması

✅ **Yetkilendirme**

- Rol tabanlı erişim kontrolü (Admin, Yönetici, Kullanıcı)
- Kaynak seviyesi izinleri

✅ **Veri Koruma**

- Argon2 ile parola şifreleme
- HTTPS/TLS desteği
- CORS güvenliği
- Rate limiting

✅ **Denetim**

- İşlem günlükleri
- Kullanıcı aktivite izleme
- Değişiklik geçmişi

---

## 📊 Veritabanı Şeması (CRM + ERP)

### CRM Core Tables

- **users** - Kullanıcı hesapları ve profiller
- **organizations** - İşletme verileri ve tenant bilgisi
- **customers** - Müşteri profilleri ve iletişim bilgileri
- **customer_interactions** - Email, telefon, not ve etkinlik geçmişi
- **sales_opportunities** - Satış fırsatları ve pipeline durumu

### ERP Integration Tables

- **orders** - Satış siparişleri (müşterilerden)
- **order_items** - Sipariş detayları ve ürün bilgileri
- **products** - Ürün kataloğu ve özellikleri
- **categories** - Ürün kategorilendirmesi
- **inventory** - Stok düzeyleri ve yönetimi
- **suppliers** - Tedarikçi bilgileri

### Analytics Tables

- **sales_analytics** - Agregat satış verileri
- **customer_analytics** - Müşteri davranış ve segment analizi
- **audit_logs** - İşlem ve erişim denetim günlükleri

---

## 🏗️ Mimari - CRM + ERP Entegrasyonu

Centura, kurumsal ERP sistemleriyle sorunsuz entegrasyon için tasarlanmıştır:

```
┌─────────────────────────────────────────┐
│         Centura CRM (Frontend)          │
│   Müşteri Yönetimi & Satış Pipeline     │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼──────┐    ┌─────▼─────┐
   │  API Gateway   │ Auth Service│
   └────┬──────┘    └─────┬─────┘
        │                 │
   ┌────▼──────────────────▼──────┐
   │   Express Backend Services    │
   ├──────────────────────────────┤
   │  CRM Svc  │ Sales Svc │ Auth │
   └────┬──────────────────┬──────┘
        │                  │
   ┌────▼──────────────────▼──────┐
   │    PostgreSQL Database        │
   ├──────────────────────────────┤
   │ Customers │ Orders │ Products│
   │ Analytics │ Users  │ Logs    │
   └──────────────────────────────┘
```

**ERP Modülleri:**

- ✅ CRM (Müşteri Yönetimi) - Ana Modül
- ✅ Sales (Satış Yönetimi) - Order Management
- ✅ Inventory (Envanter) - Stock Management

---

## 🚀 Deployment

### Development

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasını görün.

---

## 👥 Hakkında

**Centura CRM**, modern işletmeler için açık kaynak kodlu bir CRM çözümüdür ve kurumsal ERP ekosisteminin temel bileşenidir. Esneklik, güvenlik ve müşteri odaklılığı göz önünde tutularak tasarlanmıştır.

---

### 📚 Daha Fazla Bilgi

- [API Referansı](./api-tests/README.md)

---

## 🤝 Katkıda Bulunma

Centura CRM'e katkıda bulunmak ister misiniz? Harika!

1. Repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişiklikleri commit edin (`git commit -m 'feat: harika özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

Detaylı bilgi için [Katkıda Bulunma Rehberi](.github/CONTRIBUTING.md)'ni okuyun.

### Hata Bildirimi & Özellik İsteği

- 🐛 **Hata bildirmek için:** [Issue açın](https://github.com/REDLANTERNDEV/centura/issues/new)
- 💡 **Özellik önermek için:** "feature request" etiketi ile [Issue açın](https://github.com/REDLANTERNDEV/centura/issues/new)

---
