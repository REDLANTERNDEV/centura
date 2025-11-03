# 🔄 Environment Synchronization

## Problem

Bruno (API test tool) and Backend have different environment variable management:

```
Backend (.env)              Bruno (environments/)
├── PORT=4974              ├── baseUrl: http://localhost:????
├── DB_HOST=localhost      └── token:
└── JWT_SECRET=...
```

When port changes, you need to update **two places**.

---

## ✅ Solution: Automatic Synchronization

### Usage

After changing backend `.env` file:

```bash
npm run sync:bruno
```

**Output:**

```
✅ Bruno environment synced successfully!
📡 Base URL: http://localhost:4974/api/v1
```

---

## 🔧 How It Works

### 1. Script Runs

```bash
npm run sync:bruno
```

### 2. Backend .env Is Read

```properties
PORT=4974  ← This value is retrieved
```

### 3. Bruno Environment Is Updated

```plaintext
vars {
  baseUrl: http://localhost:4974/api/v1  ← Automatically created
  token:
}
```

---

## 📋 Usage Scenarios

### Scenario 1: Port Changed

```bash
# Change PORT in backend .env
PORT=5000

# Sync Bruno
npm run sync:bruno

# ✅ Bruno now uses localhost:5000
```

### Scenario 2: New Developer Joined

```bash
# Cloned the project
git clone ...

# Installed dependencies
npm install

# Synced Bruno environment
npm run sync:bruno

# ✅ Can start testing immediately!
```

### Scenario 3: CI/CD Pipeline

```yaml
# .github/workflows/test.yml
steps:
  - name: Install dependencies
    run: npm install

  - name: Sync Bruno environment
    run: npm run sync:bruno

  - name: Run API tests
    run: bruno run api-tests
```

---

## 🎯 Manual vs Automatic

### ❌ Manual Method

```
1. Backend .env PORT changed: 4974 → 5000
2. Go to Bruno Development.bru
3. Manually edit baseUrl
4. Save
```

**Risk:** Can be forgotten, error-prone

### ✅ Automatic Method

```
1. Backend .env PORT changed: 4974 → 5000
2. npm run sync:bruno
```

**Advantage:** Single command, error-free, fast

---

## 🔐 Production Environment

For production, **manual** management is recommended (security):

```plaintext
# Production.bru
vars {
  baseUrl: https://api.production.com/v1  ← Manually set
  token:                                   ← Manually entered
}
```

**Why?**

- Production URL rarely changes
- Security: .env file doesn't go to production
- Tokens come from manual entry or secret manager

---

## 📝 Script Details

**File:** `scripts/sync-bruno-env.js`

**Values Read:**

- ✅ PORT (backend .env)

**Updated File:**

- ✅ api-tests/mini-saas-api/environments/Development.bru

**Future Additions:**

- API URL pattern changes
- Different environments (staging, testing)
- Automatic token refresh

---

## 🚀 Suggestion: Pre-commit Hook

Automatic synchronization before each commit:

```bash
# Add to .husky/pre-commit file
npm run sync:bruno
```

**Advantage:** You'll never forget!

---

**Now .env and Bruno are always synchronized!** 🎯
