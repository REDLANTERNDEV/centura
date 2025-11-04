import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  // Enable standalone output for Docker deployments
  output: 'standalone',

  // Production-specific optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Ensure proper navigation in production
  skipTrailingSlashRedirect: false,
  skipMiddlewareUrlNormalize: false,

  // Optimize production builds
  compress: true,
  generateEtags: true,

  // Server configuration for Docker
  serverExternalPackages: [],
};

export default nextConfig;
