-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    group_id UUID,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('savings', 'checking', 'credit_card', 'loan', 'cash', 'investment')),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(15,2),
    available_credit DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2),
    bank_name VARCHAR(255),
    account_number_hash VARCHAR(255), -- For security, store hashed account numbers
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL,
    updated_by BIGINT
);

-- Create indexes
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_group_id ON accounts(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = true;
CREATE INDEX idx_accounts_primary ON accounts(user_id, is_primary) WHERE is_primary = true;

-- Create unique constraint for primary accounts per user
CREATE UNIQUE INDEX idx_accounts_user_primary ON accounts(user_id) WHERE is_primary = true AND group_id IS NULL;

-- Create update trigger
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();