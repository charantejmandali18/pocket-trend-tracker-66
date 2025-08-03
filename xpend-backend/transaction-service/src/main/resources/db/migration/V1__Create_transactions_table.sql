-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    group_id UUID,
    created_by BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount TEXT NOT NULL, -- Encrypted
    description TEXT NOT NULL, -- Encrypted
    category_id UUID NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    account_name TEXT NOT NULL, -- Encrypted
    notes TEXT, -- Encrypted
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    member_email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_transaction_user_id ON transactions(user_id);
CREATE INDEX idx_transaction_group_id ON transactions(group_id);
CREATE INDEX idx_transaction_category_id ON transactions(category_id);
CREATE INDEX idx_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transaction_created_by ON transactions(created_by);
CREATE INDEX idx_transaction_source ON transactions(source);

-- Create composite indexes for common query patterns
CREATE INDEX idx_transaction_user_date ON transactions(user_id, transaction_date);
CREATE INDEX idx_transaction_user_type ON transactions(user_id, transaction_type);
CREATE INDEX idx_transaction_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transaction_user_type_date ON transactions(user_id, transaction_type, transaction_date);

-- Create partial indexes for group transactions
CREATE INDEX idx_transaction_group_user ON transactions(group_id, user_id) WHERE group_id IS NOT NULL;

-- Create enum constraint for transaction_type
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_type 
    CHECK (transaction_type IN ('INCOME', 'EXPENSE'));

-- Create check constraint for source values
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_source
    CHECK (source IN ('manual', 'import', 'recurring', 'api', 'bulk'));

-- Add foreign key constraint comments (actual FKs will be managed by application)
COMMENT ON COLUMN transactions.user_id IS 'References users.id in customer-service';
COMMENT ON COLUMN transactions.created_by IS 'References users.id in customer-service';
COMMENT ON COLUMN transactions.category_id IS 'References categories.id in category-service';
COMMENT ON COLUMN transactions.group_id IS 'References groups.id in group-service';

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();