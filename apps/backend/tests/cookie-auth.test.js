/**
 * HTTP-Only Cookie Authentication Test
 * Basic test to verify cookie-based authentication is working
 */

import request from 'supertest';
import app from '../app.js';

const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
};

describe('HTTP-Only Cookie Authentication', () => {
  let cookies;

  beforeAll(async () => {
    // Setup: Create test user (you may need to adjust this based on your test setup)
    await request(app).post('/api/auth/signup').send(testUser);
  });

  describe('Login with Cookies', () => {
    test('should set HTTP-only cookies on successful login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testUser)
        .expect(200);

      // Check that cookies are set
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      // Check for access token cookie
      const accessTokenCookie = setCookieHeader.find(cookie =>
        cookie.startsWith('access_token=')
      );
      expect(accessTokenCookie).toBeDefined();
      expect(accessTokenCookie).toContain('HttpOnly');
      expect(accessTokenCookie).toContain('Path=/');

      // Check for refresh token cookie
      const refreshTokenCookie = setCookieHeader.find(cookie =>
        cookie.startsWith('refresh_token=')
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
      expect(refreshTokenCookie).toContain('Path=/api/auth');

      // Store cookies for subsequent tests
      cookies = setCookieHeader;

      // Verify response body
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testUser.email);
    });

    test('should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(response.headers['set-cookie']).toBeUndefined();
    });
  });

  describe('Protected Routes with Cookies', () => {
    test('should access protected route with valid cookie', async () => {
      // This assumes you have a protected route - adjust as needed
      const response = await request(app)
        .get('/api/user/profile') // Adjust to your protected route
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should reject access without cookie', async () => {
      const response = await request(app)
        .get('/api/user/profile') // Adjust to your protected route
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_AUTH_COOKIE');
    });
  });

  describe('Token Refresh with Cookies', () => {
    test('should refresh token with valid refresh cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', cookies)
        .expect(200);

      // Check that new cookies are set
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      const accessTokenCookie = setCookieHeader.find(cookie =>
        cookie.startsWith('access_token=')
      );
      expect(accessTokenCookie).toBeDefined();

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');

      // Update cookies for logout test
      cookies = setCookieHeader;
    });

    test('should fail refresh without refresh cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Refresh token not found in cookies');
    });
  });

  describe('Logout with Cookies', () => {
    test('should clear cookies on logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      // Check that cookies are cleared
      const setCookieHeader = response.headers['set-cookie'];
      expect(setCookieHeader).toBeDefined();

      // Check that cookies are set to expire
      const accessTokenCookie = setCookieHeader.find(cookie =>
        cookie.startsWith('access_token=')
      );
      expect(accessTokenCookie).toContain('expires=Thu, 01 Jan 1970');

      const refreshTokenCookie = setCookieHeader.find(cookie =>
        cookie.startsWith('refresh_token=')
      );
      expect(refreshTokenCookie).toContain('expires=Thu, 01 Jan 1970');

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should handle logout without cookies gracefully', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('Security Features', () => {
    test('should include security headers', async () => {
      const response = await request(app).get('/ping').expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    test('should enforce rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array(10)
        .fill()
        .map(() =>
          request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' })
        );

      const responses = await Promise.all(promises);

      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async () => {
      // This test assumes CSRF protection is enabled
      // You may need to adjust based on your implementation
      const response = await request(app)
        .post('/api/some-protected-endpoint')
        .set('Cookie', cookies)
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('CSRF');
    });
  });
});
