-- Create email_accounts table for storing encrypted email authentication data
CREATE TABLE email_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('GMAIL', 'OUTLOOK', 'YAHOO')),
    email_address VARCHAR(255) NOT NULL,
    encrypted_access_token TEXT,
    encrypted_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_from_date TIMESTAMP,
    total_emails_processed BIGINT DEFAULT 0,
    total_transactions_extracted BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_provider_email UNIQUE (user_id, provider, email_address)
);

-- Create indexes for better query performance
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_provider_email ON email_accounts(provider, email_address);
CREATE INDEX idx_email_accounts_active ON email_accounts(is_active);
CREATE INDEX idx_email_accounts_last_sync ON email_accounts(last_sync_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_accounts_updated_at 
    BEFORE UPDATE ON email_accounts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE email_accounts IS 'Stores encrypted email account credentials for transaction extraction';
COMMENT ON COLUMN email_accounts.encrypted_access_token IS 'AES-256 encrypted OAuth access token';
COMMENT ON COLUMN email_accounts.encrypted_refresh_token IS 'AES-256 encrypted OAuth refresh token';
COMMENT ON COLUMN email_accounts.total_emails_processed IS 'Total number of emails processed from this account';
COMMENT ON COLUMN email_accounts.total_transactions_extracted IS 'Total number of transactions extracted from this account';