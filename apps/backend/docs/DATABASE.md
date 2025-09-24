# Database Schema

## Overview

This document describes the database schema for the Mini SaaS application.

## Tables

### users

Primary table for user authentication and management.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL DEFAULT 1,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `org_id`: Organization identifier (default: 1)
- `email`: User's email address (unique)
- `password_hash`: Argon2 hashed password
- `role`: User role (default: 'user')
- `created_at`: Account creation timestamp

### refresh_tokens

Stores hashed JWT refresh tokens for session management.

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table
- `token_hash`: Argon2 hashed refresh token (never store plain tokens)
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp
- `is_revoked`: Token revocation status

## Indexes

```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```
