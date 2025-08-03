-- Add device_info column to refresh_tokens table
ALTER TABLE refresh_tokens ADD COLUMN device_info VARCHAR(500);

-- Update token column length to match entity
ALTER TABLE refresh_tokens ALTER COLUMN token TYPE VARCHAR(256);

-- Drop user_agent column if it exists (renamed to device_info)
-- ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS user_agent;

-- Drop updated_at column and trigger as it's not used in the entity
DROP TRIGGER IF EXISTS update_refresh_tokens_updated_at ON refresh_tokens;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS updated_at;