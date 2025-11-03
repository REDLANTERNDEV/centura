# ============================================
# Multi-stage Dockerfile for Node.js Backend
# Production-ready with security best practices
# ============================================

# ============================================
# Stage 1: Base image with dependencies
# ============================================
FROM node:20-alpine AS base

# Install security updates and dumb-init for proper signal handling
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create app directory and set ownership
WORKDIR /app

# Create non-root user for running the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ============================================
# Stage 2: Dependencies installation
# ============================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 3: Development dependencies (for build if needed)
# ============================================
FROM base AS dev-dependencies

COPY package*.json ./

# Install all dependencies including dev
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 4: Build stage (if you have build steps)
# ============================================
FROM dev-dependencies AS build

COPY . .

# Run any build scripts if needed
# RUN npm run build

# ============================================
# Stage 5: Production image
# ============================================
FROM base AS production

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 8765

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8765/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
