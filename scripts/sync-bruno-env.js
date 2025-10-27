/**
 * Sync .env to Bruno Environment
 * Automatically updates Bruno environment variables from backend .env file
 *
 * Usage: node scripts/sync-bruno-env.js
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const envPath = join(__dirname, '../apps/backend/.env');
const brunoEnvPath = join(
  __dirname,
  '../api-tests/mini-saas-api/environments/Development.bru'
);

try {
  // Read .env file
  const envContent = readFileSync(envPath, 'utf-8');

  // Parse PORT from .env (looking for standalone PORT, not DB_PORT)
  const portMatch = envContent.match(/^PORT=(\d+)/m);
  const port = portMatch ? portMatch[1] : '4974';

  // Create Bruno environment content
  const brunoContent = `vars {
  baseUrl: http://localhost:${port}/api/v1
  token: 
}
`;

  // Write to Bruno environment
  writeFileSync(brunoEnvPath, brunoContent, 'utf-8');

  console.log('✅ Bruno environment synced successfully!');
  console.log(`📡 Base URL: http://localhost:${port}/api/v1`);
} catch (error) {
  console.error('❌ Error syncing Bruno environment:', error.message);
  process.exit(1);
}
