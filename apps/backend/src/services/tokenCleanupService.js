/**
 * Automatic Token Cleanup Service
 * Professional approach used by Netflix, Spotify, Uber, etc.
 *
 * ✅ Runs automatically every hour
 * ✅ No manual intervention needed
 * ✅ Cleans expired/revoked tokens
 * ✅ Prevents database bloat
 */

import cron from 'node-cron';
import userModel from '../models/userModel.js';

class TokenCleanupService {
  constructor() {
    this.isRunning = false;
  }

  // Start automatic cleanup when server starts
  startAutoCleanup() {
    console.log('🤖 Starting automatic token cleanup service...');

    // Run cleanup every hour (industry standard)
    cron.schedule('0 * * * *', async () => {
      await this.performCleanup();
    });

    // Run initial cleanup when server starts
    this.performCleanup();
  }

  async performCleanup() {
    if (this.isRunning) return; // Prevent overlapping runs

    this.isRunning = true;

    try {
      const deletedCount = await userModel.deleteExpiredTokens();

      if (deletedCount > 0) {
        console.log(`🧹 Auto-cleaned ${deletedCount} expired tokens`);
      }
    } catch (error) {
      console.error('❌ Token cleanup error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }
}

// Export singleton instance
export default new TokenCleanupService();
