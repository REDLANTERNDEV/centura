/**
 * Centralized message/error translations
 * All backend error messages and success messages in Turkish
 */

export const MESSAGES = {
  // Authentication & Authorization
  AUTH: {
    NO_AUTH_COOKIE: 'Erişim reddedildi. Kimlik doğrulama çerezi bulunamadı.',
    INVALID_TOKEN: 'Erişim reddedildi. Geçersiz kimlik doğrulama çerezi.',
    TOKEN_EXPIRED: 'Erişim reddedildi. Kimlik doğrulama süresi dolmuş.',
    INVALID_TOKEN_TYPE: 'Erişim reddedildi. Geçersiz token türü.',
    NOT_AUTHENTICATED: 'Erişim reddedildi. Kullanıcı kimliği doğrulanmadı.',
    INVALID_CREDENTIALS: 'Geçersiz e-posta veya şifre.',
    EMAIL_PASSWORD_REQUIRED: 'E-posta ve şifre gereklidir.',
    LOGIN_SUCCESS: 'Giriş başarılı.',
    LOGOUT_SUCCESS: 'Çıkış başarılı.',
    SIGNUP_SUCCESS: 'Kayıt başarılı.',
    EMAIL_ALREADY_EXISTS: 'Bu e-posta adresi zaten kullanılıyor.',
    INVALID_EMAIL: 'Geçersiz e-posta adresi.',
    PASSWORD_TOO_SHORT: 'Şifre en az 8 karakter olmalıdır.',
    REFRESH_TOKEN_EXPIRED: "Yenileme token'ı süresi dolmuş.",
    INVALID_REFRESH_TOKEN: "Geçersiz yenileme token'ı.",
    TOKEN_REFRESH_SUCCESS: 'Token başarıyla yenilendi.',
  },

  // Authorization & Roles
  AUTHORIZATION: {
    ORG_ID_REQUIRED: "Organizasyon ID'si gereklidir.",
    NO_ORG_ACCESS: 'Erişim reddedildi. Bu organizasyona erişim yetkiniz yok.',
    INSUFFICIENT_PERMISSIONS: 'Erişim reddedildi. Yetersiz yetki.',
    SUPER_ADMIN_DEPRECATED:
      'Süper admin erişimi güvenlik nedeniyle kaldırıldı. Organizasyon tabanlı roller kullanın.',
  },

  // General Errors
  ERROR: {
    SERVER_ERROR: 'Sunucu hatası.',
    INTERNAL_SERVER_ERROR: 'İç sunucu hatası.',
    AUTH_ERROR: 'Kimlik doğrulama sırasında bir hata oluştu.',
    VALIDATION_FAILED: 'Doğrulama başarısız.',
    NOT_FOUND: 'Kayıt bulunamadı.',
    ROUTE_NOT_FOUND: 'Sayfa bulunamadı.',
    DATABASE_ERROR: 'Veritabanı hatası.',
  },

  // Product Messages
  PRODUCT: {
    CREATED: 'Ürün başarıyla oluşturuldu.',
    UPDATED: 'Ürün başarıyla güncellendi.',
    DELETED: 'Ürün başarıyla silindi.',
    NOT_FOUND: 'Ürün bulunamadı.',
    STOCK_UPDATED: 'Stok başarıyla güncellendi.',
    INSUFFICIENT_STOCK: 'Yetersiz stok.',
    RETRIEVE_ERROR: 'Ürünler getirilirken hata oluştu.',
    DELETE_ERROR: 'Ürün silinirken hata oluştu.',
    LOW_STOCK_ERROR: 'Düşük stoklu ürünler getirilirken hata oluştu.',
    SKU_EXISTS: 'Bu SKU koduna sahip ürün zaten mevcut.',
    CREATE_ERROR: 'Ürün oluşturulurken hata oluştu.',
    UPDATE_ERROR: 'Ürün güncellenirken hata oluştu.',
    STOCK_UPDATE_ERROR: 'Stok güncellenirken hata oluştu.',
  },

  // Customer Messages
  CUSTOMER: {
    CREATED: 'Müşteri başarıyla oluşturuldu.',
    UPDATED: 'Müşteri başarıyla güncellendi.',
    DELETED: 'Müşteri başarıyla silindi.',
    NOT_FOUND: 'Müşteri bulunamadı.',
    RETRIEVE_ERROR: 'Müşteriler getirilirken hata oluştu.',
    DELETE_ERROR: 'Müşteri silinirken hata oluştu.',
  },

  // Order Messages
  ORDER: {
    CREATED: 'Sipariş başarıyla oluşturuldu.',
    UPDATED: 'Sipariş başarıyla güncellendi.',
    DELETED: 'Sipariş başarıyla silindi.',
    CANCELLED: 'Sipariş başarıyla iptal edildi.',
    NOT_FOUND: 'Sipariş bulunamadı.',
    STATUS_UPDATED: 'Sipariş durumu başarıyla güncellendi.',
    PAYMENT_STATUS_UPDATED: 'Ödeme durumu başarıyla güncellendi.',
    RETRIEVE_ERROR: 'Siparişler getirilirken hata oluştu.',
    DELETE_ERROR: 'Sipariş silinirken hata oluştu.',
    CUSTOMER_REQUIRED: "Müşteri ID'si gereklidir.",
    ITEMS_REQUIRED: 'Sipariş kalemleri gereklidir.',
    INVALID_STATUS: 'Geçersiz sipariş durumu.',
    INVALID_PAYMENT_STATUS: 'Geçersiz ödeme durumu.',
  },

  // Organization Messages
  ORGANIZATION: {
    CREATED: 'Organizasyon başarıyla oluşturuldu.',
    UPDATED: 'Organizasyon başarıyla güncellendi.',
    DELETED: 'Organizasyon başarıyla silindi.',
    NOT_FOUND: 'Organizasyon bulunamadı.',
    RETRIEVE_ERROR: 'Organizasyonlar getirilirken hata oluştu.',
    NAME_REQUIRED: 'Organizasyon adı gereklidir.',
  },

  // Insights Messages
  INSIGHTS: {
    NO_ORG_SELECTED: 'Organizasyon seçilmedi.',
    RETRIEVE_ERROR: 'Veriler getirilirken hata oluştu.',
  },

  // Security Messages
  SECURITY: {
    RATE_LIMIT_EXCEEDED:
      "Bu IP'den çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin.",
    AUTH_RATE_LIMIT:
      'Çok fazla kimlik doğrulama denemesi, lütfen daha sonra tekrar deneyin.',
    SENSITIVE_OPERATION_LIMIT:
      'Çok fazla hassas işlem denemesi, lütfen daha sonra tekrar deneyin.',
    CSRF_GENERATION_ERROR: 'CSRF token üretimi sırasında iç sunucu hatası.',
    CSRF_TOKEN_MISSING: 'CSRF token eksik.',
    CSRF_TOKEN_INVALID: 'Geçersiz CSRF token.',
    COOKIE_SECURITY_ERROR: "Çerez güvenlik middleware'inde iç sunucu hatası.",
  },

  // Validation Messages
  VALIDATION: {
    INVALID_EMAIL: 'Geçersiz e-posta adresi.',
    EMAIL_REQUIRED: 'E-posta gereklidir.',
    EMAIL_TOO_LONG: 'E-posta 255 karakteri aşmamalıdır.',
    PASSWORD_REQUIRED: 'Şifre gereklidir.',
    PASSWORD_TOO_SHORT: 'Şifre en az 8 karakter olmalıdır.',
    NAME_REQUIRED: 'Ad gereklidir.',
    NAME_TOO_LONG: 'Ad {{max}} karakteri aşmamalıdır.',
    FIELD_REQUIRED: '{{field}} gereklidir.',
    FIELD_TOO_LONG: '{{field}} {{max}} karakteri aşmamalıdır.',
    FIELD_TOO_SHORT: '{{field}} en az {{min}} karakter olmalıdır.',
    INVALID_NUMBER: 'Geçersiz sayı.',
    INVALID_DATE: 'Geçersiz tarih.',
    INVALID_BOOLEAN: 'Geçersiz boolean değer.',
    MUST_BE_ONE_OF: '{{field}} şunlardan biri olmalıdır: {{values}}',
  },
};

/**
 * Get a message with optional parameter interpolation
 * @param {string} path - Dot notation path to message (e.g., 'AUTH.LOGIN_SUCCESS')
 * @param {Object} params - Parameters to interpolate into the message
 * @returns {string} - The message
 */
export const getMessage = (path, params = {}) => {
  const keys = path.split('.');
  let message = MESSAGES;

  for (const key of keys) {
    message = message[key];
    if (!message) {
      console.warn(`Message not found for path: ${path}`);
      return path; // Return the path itself if message not found
    }
  }

  // Interpolate parameters
  if (typeof message === 'string' && Object.keys(params).length > 0) {
    return message.replaceAll(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] === undefined ? match : params[key];
    });
  }

  return message;
};

export default MESSAGES;
