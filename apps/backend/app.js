import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import errorHandler from './src/middleware/errorHandler.js';
import routes from './src/routes/index.js';
import authRoutes from './src/routes/authRoutes.js';
import {
  securityHeaders,
  generalLimiter,
  healthCheckLimiter,
  cookieSecurity,
  securityLogger,
} from './src/middleware/security.js';

const app = express();

// CORS configuration (must be before other middleware)
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.NODE_ENV === 'development' ? 'http://localhost:4321' : null,
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Organization-ID', // Allow organization context header
    ],
    exposedHeaders: ['X-Organization-ID'], // Expose header to frontend
  })
);

// Security middleware (should be first)
app.use(securityHeaders);
app.use(cookieSecurity);
app.use(generalLimiter);

// Cookie parsing middleware (required for HTTP-only cookies)
app.use(cookieParser());

// Security logger middleware (after cookie parser to access cookies)
app.use(securityLogger);

// Session middleware for CSRF protection
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    name: 'sessionId', // Don't use default session name
  })
);

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy if behind a reverse proxy (important for rate limiting)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Legacy ping endpoint (for backwards compatibility)
app.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api', routes);

// Auth routes
app.use('/api/auth', authRoutes);

// Health check endpoints (for Docker and monitoring)
// Rate limited to prevent abuse
app.get('/health', healthCheckLimiter, (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/v1/health', healthCheckLimiter, (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

export default app;
