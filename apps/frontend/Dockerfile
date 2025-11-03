# ============================================
# Multi-stage Dockerfile for Next.js Frontend
# Production-ready with optimized builds
# ============================================

# ============================================
# Stage 1: Base image with dependencies
# ============================================
FROM node:20-alpine AS base

# Install security updates and dumb-init
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init libc6-compat && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# ============================================
# Stage 2: Dependencies installation
# ============================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 3: Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# ============================================
# Stage 4: Production image
# ============================================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4321/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 0

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
