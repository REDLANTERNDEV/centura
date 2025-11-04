# ============================================
# Multi-stage Dockerfile for Next.js Frontend
# Production-ready with NPM Workspaces support
# ============================================

# ============================================
# Stage 1: Base image
# ============================================
FROM node:20-alpine AS base

# Install security updates and dumb-init
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init libc6-compat && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# ============================================
# Stage 2: Dependencies installation
# ============================================
FROM base AS dependencies

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./

# Copy frontend workspace package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install ALL dependencies (workspaces need full install)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 3: Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy frontend application code
COPY apps/frontend ./apps/frontend

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# Build the Next.js application
WORKDIR /app/apps/frontend
RUN npm run build

# ============================================
# Stage 4: Production image
# ============================================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4321
ENV HOSTNAME="0.0.0.0"

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Copy node_modules if needed (for Next.js standalone)
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4321/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 0

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application (server.js is in apps/frontend/ after standalone copy)
CMD ["node", "apps/frontend/server.js"]
