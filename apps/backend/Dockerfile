# ============================================
# Multi-stage Dockerfile for Node.js Backend
# Production-ready with NPM Workspaces support
# ============================================

# ============================================
# Stage 1: Base image
# ============================================
FROM node:20-alpine AS base

# Install security updates and dumb-init for proper signal handling
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for running the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ============================================
# Stage 2: Dependencies installation
# ============================================
FROM base AS dependencies

WORKDIR /app

# Copy workspace root package files
COPY package*.json ./

# Copy backend workspace package.json
COPY apps/backend/package.json ./apps/backend/

# Install ALL dependencies (workspaces need full install)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 3: Build stage
# ============================================
FROM base AS build

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy backend application code only
COPY apps/backend ./apps/backend

# Run any build scripts if needed
# RUN npm run build --workspace mini-saas-erp-be

# ============================================
# Stage 4: Development image (for development with hot reload)
# ============================================
FROM base AS dev

WORKDIR /app

# Copy node_modules from dependencies stage (includes devDependencies)
COPY --from=dependencies /app/node_modules ./node_modules

# Copy all package files
COPY package*.json ./
COPY apps/backend/package.json ./apps/backend/

# Copy backend application code
COPY apps/backend ./apps/backend

# Ensure proper permissions for the nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 8765

# Development command will be overridden in docker-compose
CMD ["npm", "run", "dev"]

# ============================================
# Stage 5: Production image
# ============================================
FROM base AS production

WORKDIR /app/apps/backend

# Set environment to production
ENV NODE_ENV=production

# Copy production dependencies (only what backend needs)
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules /app/node_modules

# Copy backend application code
COPY --chown=nodejs:nodejs apps/backend .

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
