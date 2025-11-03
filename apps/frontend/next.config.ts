import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  // Enable standalone output for Docker deployments
  output: 'standalone',
};

export default nextConfig;
