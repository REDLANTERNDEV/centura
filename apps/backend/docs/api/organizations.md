# Organization API - Test Guide

## Organizasyon Yönetimi API'si Kullanım Kılavuzu

### 📋 Genel Bakış

Organization API, ERP/CRM sisteminizde organizasyon (şirket) yönetimi için kullanılır. Tüm endpoint'ler JWT token ile korunmaktadır ve multi-tenancy mimarisi ile çalışır.

**Base URL:** `http://localhost:4974/api/v1/organizations`

---

## 🔐 Authentication

Tüm endpoint'ler için HTTP-only cookie içinde JWT token gereklidir. Önce giriş yapın:

```bash
POST http://localhost:4974/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

---

## 📌 API Endpoints

### 1️⃣ Kendi Organizasyonunu Getir (User)

```bash
GET http://localhost:4974/api/v1/organizations/me
```

**Yanıt:**

```json
{
  "success": true,
  "message": "Organization retrieved successfully",
  "data": {
    "org_id": 1,
    "org_code": "ORG001",
    "name": "Default Organization",
    "email": "info@default.com",
    "phone": "+90-555-000-0001",
    "address": "Istanbul, Turkey",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 2️⃣ Tüm Organizasyonları Listele (Admin için tümü, User için sadece kendi)

```bash
GET http://localhost:4974/api/v1/organizations?page=1&limit=10&search=default&is_active=true&sort=name&order=asc
```

**Query Parameters:**

- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Records per page
- `search` (string) - Search term (name, org_code, email)
- `is_active` (boolean) - Active status filter
- `sort` (string) - Sort field (name, org_code, created_at)
- `order` (string) - Sort direction (asc, desc)

**Response:**

```json
{
  "success": true,
  "message": "Organizations retrieved successfully",
  "data": {
    "organizations": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 3️⃣ Get Organization Details

```bash
GET http://localhost:4974/api/v1/organizations/1
```

**Response:**

```json
{
  "success": true,
  "message": "Organization retrieved successfully",
  "data": {
    "org_id": 1,
    "org_code": "ORG001",
    "name": "Default Organization",
    "email": "info@default.com",
    "phone": "+90-555-000-0001",
    "address": "Istanbul, Turkey",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** Regular users can only view their own organizations.

---

### 4️⃣ Yeni Organizasyon Oluştur (Sadece Admin)

```bash
POST http://localhost:4974/api/v1/organizations
Content-Type: application/json

{
  "org_code": "ACME",
  "name": "ACME Corporation",
  "email": "info@acme.com",
  "phone": "+90-212-555-1234",
  "address": "Maslak, Istanbul, Turkey",
  "is_active": true
}
```

**Zorunlu Alanlar:**

- `org_code` (string, 2-50 karakter, unique) - Organizasyon kodu
- `name` (string, 2-200 karakter) - Organizasyon adı
- `email` (string, valid email) - Email adresi

**Opsiyonel Alanlar:**

- `phone` (string) - Telefon numarası
- `address` (string) - Adres
- `is_active` (boolean, default: true) - Aktiflik durumu

**Yanıt:**

```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "org_id": 6,
    "org_code": "ACME",
    "name": "ACME Corporation",
    "email": "info@acme.com",
    "phone": "+90-212-555-1234",
    "address": "Maslak, Istanbul, Turkey",
    "is_active": true,
    "created_at": "2024-01-20T14:30:00.000Z",
    "updated_at": "2024-01-20T14:30:00.000Z"
  }
}
```

---

### 5️⃣ Organizasyon Güncelle

```bash
PUT http://localhost:4974/api/v1/organizations/1
Content-Type: application/json

{
  "name": "Updated Organization Name",
  "phone": "+90-212-555-9999",
  "is_active": true
}
```

**Güncellenebilir Alanlar:**

- `name` (string, 2-200 karakter)
- `email` (string, valid email)
- `phone` (string)
- `address` (string)
- `is_active` (boolean)

**Note:**

- `org_code` cannot be updated (unique identifier)
- Admins can update all organizations
- Regular users can only update their own organizations

---

### 6️⃣ Delete Organization (Admin Only)

```bash
DELETE http://localhost:4974/api/v1/organizations/6?hard=false
```

**Query Parameters:**

- `hard` (boolean, default: false)
  - `false`: Soft delete (is_active = false)
  - `true`: Hard delete (permanently remove from database)

**Response:**

```json
{
  "success": true,
  "message": "Organization deleted successfully (soft delete)"
}
```

**Important Notes:**

- Only admin users can delete organizations
- Be careful with hard delete (irreversible)
- If organization has users and customers, you may need to delete them first

---

### 7️⃣ Organizasyon İstatistikleri

```bash
GET http://localhost:4974/api/v1/organizations/1/stats
```

**Yanıt:**

```json
{
  "success": true,
  "message": "Organization statistics retrieved successfully",
  "data": {
    "org_id": 1,
    "org_name": "Default Organization",
    "total_users": 10,
    "total_customers": 45,
    "active_customers": 42,
    "inactive_customers": 3,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** Regular users can only view their own organization's statistics.

---

## 🔒 Permission Levels

### Admin User

- ✅ Lists all organizations
- ✅ Views any organization
- ✅ Creates new organizations
- ✅ Updates any organization
- ✅ Deletes any organization
- ✅ Views any organization's statistics

### Regular User

- ✅ Views only their own organization
- ✅ Updates their own organization
- ✅ Views their own organization's statistics
- ❌ Cannot view other organizations
- ❌ Cannot create new organizations
- ❌ Cannot delete organizations

---

## ❌ Hata Durumları

### 1. Yetkisiz Erişim (403)

```json
{
  "success": false,
  "message": "Insufficient permissions. Admin access required"
}
```

### 2. Organizasyon Bulunamadı (404)

```json
{
  "success": false,
  "message": "Organization not found"
}
```

### 3. Duplicate Organizasyon Kodu (409)

```json
{
  "success": false,
  "message": "Organization code already exists"
}
```

### 4. Validation Hatası (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Organization code must be between 2 and 50 characters",
    "Invalid email format"
  ]
}
```

---

## 🧪 Test Senaryoları

### 1. Admin Kullanıcı Testi

```bash
# 1. Admin olarak giriş yap
POST /api/v1/auth/login
Body: { "email": "admin@example.com", "password": "Admin123!" }

# 2. Yeni organizasyon oluştur
POST /api/v1/organizations
Body: { "org_code": "TEST", "name": "Test Org", "email": "test@test.com" }

# 3. Tüm organizasyonları listele
GET /api/v1/organizations

# 4. Organizasyon güncelle
PUT /api/v1/organizations/2
Body: { "name": "Updated Test Org" }

# 5. Organizasyonu soft delete yap
DELETE /api/v1/organizations/2?hard=false
```

### 2. Normal Kullanıcı Testi

```bash
# 1. User olarak giriş yap
POST /api/v1/auth/login
Body: { "email": "john.doe@example.com", "password": "User123!" }

# 2. Kendi organizasyonunu getir
GET /api/v1/organizations/me

# 3. Kendi organizasyonunu güncelle
PUT /api/v1/organizations/1
Body: { "phone": "+90-555-999-8888" }

# 4. İstatistikleri görüntüle
GET /api/v1/organizations/1/stats

# 5. Başka organizasyonu görmeye çalış (BAŞARISIZ OLMALI)
GET /api/v1/organizations/2
# Beklenen: 403 Forbidden
```

---

## 🔄 Multi-Tenancy Mimarisi

Her kullanıcı JWT token içinde `org_id` taşır:

```javascript
// JWT Payload
{
  "userId": 1,
  "email": "john@example.com",
  "role": "user",
  "org_id": 1  // ← Organizasyon ID'si
}
```

**Veri İzolasyonu:**

- Admin kullanıcılar: Tüm organizasyonları görebilir/yönetebilir
- Normal kullanıcılar: Sadece `req.user.org_id === organization.org_id` olan kayıtları görebilir

---

## 📝 Örnek Workflow

### Yeni Şirket Eklemek (Admin)

1. **Admin olarak giriş yap**

```bash
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

2. **Organizasyon oluştur**

```bash
POST /api/v1/organizations
{
  "org_code": "NEWCO",
  "name": "New Company Ltd.",
  "email": "info@newco.com",
  "phone": "+90-212-555-7777",
  "address": "Ankara, Turkey",
  "is_active": true
}
```

3. **Organizasyon için kullanıcı oluştur** (Auth API'den)

```bash
POST /api/v1/auth/signup
{
  "email": "manager@newco.com",
  "password": "Password123!",
  "name": "Company Manager",
  "role": "user",
  "org_id": 7  // Yeni oluşturulan org_id
}
```

4. **Organizasyon müşterileri ekle** (Customer API'den)

```bash
POST /api/v1/customers
{
  "customer_code": "C001",
  "name": "First Customer",
  "email": "customer@example.com",
  ...
}
```

---

## 🎯 Sonraki Adımlar

1. ✅ Organization API kullanıma hazır
2. ✅ Admin panel için kullanabilirsiniz
3. ✅ Customer API ile entegre çalışır
4. ⏭️ Frontend'de organization selection dropdown ekleyebilirsiniz (admin için)
5. ⏭️ Organization-level settings ve konfigürasyonlar eklenebilir

---

**Not:** Tüm endpoint'ler production-ready, native JavaScript validation kullanıyor ve enterprise standartlarına uygun!
