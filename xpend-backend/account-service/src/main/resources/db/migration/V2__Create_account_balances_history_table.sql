-- Create account balance history for tracking changes
CREATE TABLE account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    change_amount DECIMAL(15,2) NOT NULL,
    change_reason VARCHAR(100) NOT NULL CHECK (change_reason IN ('transaction', 'manual_adjustment', 'interest', 'fee', 'transfer', 'reconciliation')),
    reference_id UUID, -- Reference to transaction or other entity that caused the change
    reference_type VARCHAR(50), -- Type of reference (transaction, adjustment, etc.)
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NOT NULL
);

-- Create indexes
CREATE INDEX idx_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX idx_balance_history_created_at ON account_balance_history(created_at);
CREATE INDEX idx_balance_history_reference ON account_balance_history(reference_id, reference_type) WHERE reference_id IS NOT NULL;

-- Create account summary table for quick access to aggregated data
CREATE TABLE account_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    group_id UUID,
    summary_date DATE NOT NULL,
    total_assets DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_worth DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    liquid_cash DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    available_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for account summary
CREATE INDEX idx_account_summary_user_id ON account_summary(user_id);
CREATE INDEX idx_account_summary_group_id ON account_summary(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_account_summary_date ON account_summary(summary_date);
CREATE UNIQUE INDEX idx_account_summary_user_date ON account_summary(user_id, summary_date) WHERE group_id IS NULL;
CREATE UNIQUE INDEX idx_account_summary_group_date ON account_summary(group_id, summary_date) WHERE group_id IS NOT NULL;

-- Create update trigger for account summary
CREATE TRIGGER trigger_account_summary_updated_at
    BEFORE UPDATE ON account_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();