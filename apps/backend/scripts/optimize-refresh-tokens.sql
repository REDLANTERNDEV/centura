-- ============================================
-- Performance Optimization for Refresh Tokens
-- ============================================
-- This script adds indexes to improve login/logout performance
-- Run this on your database to optimize token lookups

-- Add index on expires_at and is_revoked for faster token validation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
ON refresh_tokens(expires_at, is_revoked) 
WHERE is_revoked = FALSE AND expires_at > NOW();

-- Add index on user_id for faster user token lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id 
ON refresh_tokens(user_id);

-- Add index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at 
ON refresh_tokens(created_at DESC);

-- Composite index for the most common query pattern
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_lookup 
ON refresh_tokens(expires_at DESC, is_revoked, created_at DESC) 
WHERE is_revoked = FALSE;

-- Clean up expired and revoked tokens (optional but recommended)
-- Uncomment the line below if you want to delete old tokens now
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE;

-- Vacuum analyze to update statistics after adding indexes
VACUUM ANALYZE refresh_tokens;

-- Show index information
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'refresh_tokens'
ORDER BY 
    indexname;
