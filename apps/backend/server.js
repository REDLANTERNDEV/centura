import { connectDB } from './src/config/db.js';
import app from './app.js';
import tokenCleanupService from './src/services/tokenCleanupService.js';

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // 🤖 Start automatic token cleanup (NO MANUAL INTERVENTION NEEDED)
  tokenCleanupService.startAutoCleanup();
});
