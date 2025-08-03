-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(256) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_refresh_tokens_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_refresh_token_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_token_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_token_revoked ON refresh_tokens(revoked);
CREATE INDEX idx_refresh_token_user_revoked ON refresh_tokens(user_id, revoked);

