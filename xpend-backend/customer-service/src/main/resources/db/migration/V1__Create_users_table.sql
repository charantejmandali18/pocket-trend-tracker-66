-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    profile_picture_url VARCHAR(500),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    account_locked BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_google_id ON users(google_id);
CREATE INDEX idx_user_auth_provider ON users(auth_provider);
CREATE INDEX idx_user_account_locked ON users(account_locked);

-- Create enum constraint for auth_provider
ALTER TABLE users ADD CONSTRAINT chk_auth_provider 
    CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();