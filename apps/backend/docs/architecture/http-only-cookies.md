# HTTP-Only Secure Cookie Implementation Guide

## Overview

This implementation converts the JWT-based authentication system to use HTTP-only secure cookies following enterprise-grade security practices. This approach provides enhanced security by preventing XSS attacks from accessing authentication tokens while maintaining a seamless user experience.

## Security Features Implemented

### 1. HTTP-Only Cookies

- **Access tokens**: Stored in HTTP-only cookies, inaccessible to JavaScript
- **Refresh tokens**: Stored in separate HTTP-only cookies with restricted paths
- **Automatic expiration**: Cookies automatically expire based on JWT expiration times

### 2. Cookie Security Configuration

```javascript
{
  httpOnly: true,              // Prevents XSS access
  secure: true,                // HTTPS only in production
  sameSite: 'strict',         // CSRF protection
  path: '/',                  // Cookie scope
  maxAge: 900000,            // 15 minutes for access tokens
  domain: 'yourdomain.com'   // Domain restriction
}
```

### 3. Security Headers (Helmet.js)

- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options
- Referrer Policy
- Cross-Origin Resource Policy

### 4. Rate Limiting

- **General API**: 100 requests per 15 minutes per IP/user
- **Authentication endpoints**: 5 attempts per 15 minutes
- **Sensitive operations**: 3 attempts per hour

### 5. CSRF Protection

- CSRF tokens for state-changing operations
- Token validation middleware
- Secure token generation and storage

## Cookie Types

### Access Token Cookie

- **Name**: `access_token`
- **Duration**: 15 minutes
- **Path**: `/` (entire application)
- **Usage**: API authentication

### Refresh Token Cookie

- **Name**: `refresh_token`
- **Duration**: 7 days
- **Path**: `/api/auth` (restricted to auth endpoints)
- **Usage**: Token refresh operations

### CSRF Token Cookie

- **Name**: `csrf_token`
- **Duration**: 24 hours
- **Path**: `/`
- **HTTP-Only**: `false` (needs to be readable by client)
- **Usage**: CSRF protection

## Authentication Flow

### 1. Login Process

```
Client                    Server
  |                        |
  |-- POST /api/auth/login -|
  |     { email, password } |
  |                        |-- Validate credentials
  |                        |-- Generate JWT tokens
  |                        |-- Set HTTP-only cookies
  |<-- 200 OK -------------|
      Set-Cookie: access_token=jwt; HttpOnly; Secure
      Set-Cookie: refresh_token=jwt; HttpOnly; Secure; Path=/api/auth
```

### 2. Authenticated Request

```
Client                    Server
  |                        |
  |-- GET /api/protected --|
  |   Cookie: access_token |
  |                        |-- Extract token from cookie
  |                        |-- Verify JWT
  |<-- 200 OK -------------|
      { protected_data }
```

### 3. Token Refresh

```
Client                    Server
  |                        |
  |-- POST /api/auth/refresh-token --|
  |   Cookie: refresh_token |
  |                        |-- Verify refresh token
  |                        |-- Generate new tokens
  |                        |-- Set new cookies (token rotation)
  |<-- 200 OK -------------|
      Set-Cookie: access_token=new_jwt; HttpOnly; Secure
      Set-Cookie: refresh_token=new_jwt; HttpOnly; Secure
```

### 4. Logout Process

```
Client                    Server
  |                        |
  |-- POST /api/auth/logout --|
  |   Cookie: refresh_token |
  |                        |-- Revoke tokens in database
  |                        |-- Clear cookies
  |<-- 200 OK -------------|
      Set-Cookie: access_token=; expires=Thu, 01 Jan 1970
      Set-Cookie: refresh_token=; expires=Thu, 01 Jan 1970
```

## Environment Configuration

### Required Environment Variables

```bash
# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Cookie Configuration
COOKIE_DOMAIN=yourdomain.com  # Production only
NODE_ENV=production

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Development vs Production

- **Development**: Cookies work over HTTP, sameSite='lax'
- **Production**: Cookies require HTTPS, sameSite='strict'

## Middleware Integration

### 1. Authentication Middleware

```javascript
// Cookie-based token verification
export const verifyToken = (req, res, next) => {
  const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  // Token validation logic...
};
```

### 2. Security Middleware Stack

```javascript
app.use(securityHeaders); // Helmet security headers
app.use(cookieSecurity); // Cookie security enforcement
app.use(securityLogger); // Security event logging
app.use(generalLimiter); // Rate limiting
app.use(cookieParser()); // Cookie parsing
app.use(session()); // Session for CSRF
```

## Frontend Integration

### 1. API Calls

No changes required for API calls - cookies are automatically sent:

```javascript
fetch('/api/protected', {
  credentials: 'include', // Include cookies
  headers: {
    'X-CSRF-Token': getCsrfToken(), // For state-changing operations
  },
});
```

### 2. CSRF Protection

Include CSRF token in headers for POST/PUT/PATCH/DELETE:

```javascript
function getCsrfToken() {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf_token='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
}
```

### 3. Logout

Simple logout call - server handles cookie clearing:

```javascript
fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

## Security Benefits

### 1. XSS Protection

- Tokens inaccessible to JavaScript
- No localStorage or sessionStorage vulnerabilities
- Automatic token handling

### 2. CSRF Protection

- SameSite cookie attribute
- CSRF token validation
- Domain restriction

### 3. Token Security

- Automatic token rotation
- Secure storage in HTTP-only cookies
- Path-based restrictions for refresh tokens

### 4. Session Management

- Automatic expiration
- Server-side token revocation
- Secure logout process

## Monitoring and Logging

### Security Events Logged

- Authentication attempts
- Token refresh operations
- CSRF validation failures
- Rate limit violations
- Cookie security events

### Log Format

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "method": "POST",
  "url": "/api/auth/login",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "userId": "user123",
  "hasAuthCookie": true,
  "hasRefreshCookie": true
}
```

## Production Deployment Checklist

### 1. Environment Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure `COOKIE_DOMAIN` for your domain
- [ ] Set secure `JWT_SECRET` and `SESSION_SECRET`
- [ ] Enable HTTPS (required for secure cookies)

### 2. Security Headers

- [ ] Configure Content Security Policy
- [ ] Enable HSTS
- [ ] Set up proper CORS configuration
- [ ] Configure reverse proxy settings

### 3. Rate Limiting

- [ ] Adjust rate limits for production load
- [ ] Configure Redis for distributed rate limiting (optional)
- [ ] Set up IP whitelisting for trusted sources

### 4. Monitoring

- [ ] Set up security event monitoring
- [ ] Configure alerting for suspicious activity
- [ ] Implement audit logging
- [ ] Set up health check endpoints

## Troubleshooting

### Common Issues

1. **Cookies not being set**
   - Check HTTPS in production
   - Verify domain configuration
   - Check cookie path settings

2. **CSRF validation failures**
   - Ensure CSRF token is included in headers
   - Check session configuration
   - Verify cookie accessibility

3. **Rate limiting issues**
   - Check IP detection behind proxy
   - Verify rate limit configuration
   - Consider user-based rate limiting

### Debug Mode

Enable detailed logging by setting appropriate log levels in your environment.

## Migration from Bearer Tokens

### Backend Changes

1. Update middleware to read from cookies
2. Modify login/logout to set/clear cookies
3. Add security middleware stack
4. Update error handling

### Frontend Changes

1. Remove token storage logic
2. Add CSRF token handling
3. Update logout implementation
4. Test cookie-based authentication

This implementation provides enterprise-grade security while maintaining compatibility with existing applications.
