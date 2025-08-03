-- Create transaction audit table for tracking changes
CREATE TABLE transaction_audit (
    id BIGSERIAL PRIMARY KEY,
    transaction_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by BIGINT NOT NULL,
    change_reason VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit table
CREATE INDEX idx_transaction_audit_transaction_id ON transaction_audit(transaction_id);
CREATE INDEX idx_transaction_audit_user_id ON transaction_audit(user_id);
CREATE INDEX idx_transaction_audit_action ON transaction_audit(action);
CREATE INDEX idx_transaction_audit_changed_by ON transaction_audit(changed_by);
CREATE INDEX idx_transaction_audit_created_at ON transaction_audit(created_at);

-- Create composite index for common audit queries
CREATE INDEX idx_transaction_audit_transaction_date ON transaction_audit(transaction_id, created_at);

-- Create constraint for action values
ALTER TABLE transaction_audit ADD CONSTRAINT chk_audit_action 
    CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'BULK_CREATE', 'BULK_UPDATE', 'BULK_DELETE'));

-- Add comments for audit table
COMMENT ON TABLE transaction_audit IS 'Audit trail for all transaction changes';
COMMENT ON COLUMN transaction_audit.old_values IS 'JSON representation of old values before change';
COMMENT ON COLUMN transaction_audit.new_values IS 'JSON representation of new values after change';
COMMENT ON COLUMN transaction_audit.change_reason IS 'Optional reason for the change';

-- Create function to automatically audit transaction changes
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit record for DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO transaction_audit (
            transaction_id, user_id, action, old_values, changed_by, created_at
        ) VALUES (
            OLD.id, OLD.user_id, TG_OP, row_to_json(OLD), OLD.user_id, CURRENT_TIMESTAMP
        );
        RETURN OLD;
    END IF;
    
    -- Insert audit record for INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO transaction_audit (
            transaction_id, user_id, action, new_values, changed_by, created_at
        ) VALUES (
            NEW.id, NEW.user_id, TG_OP, row_to_json(NEW), NEW.created_by, CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    
    -- Insert audit record for UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO transaction_audit (
            transaction_id, user_id, action, old_values, new_values, changed_by, created_at
        ) VALUES (
            NEW.id, NEW.user_id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.user_id, CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for transaction audit
CREATE TRIGGER transaction_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_transaction_changes();