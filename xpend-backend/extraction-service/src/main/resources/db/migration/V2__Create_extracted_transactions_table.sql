-- Create extracted_transactions table for storing parsed transaction data from emails
CREATE TABLE extracted_transactions (
    id BIGSERIAL PRIMARY KEY,
    email_account_id BIGINT NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    email_message_id VARCHAR(255) NOT NULL,
    email_subject VARCHAR(500),
    sender_email VARCHAR(255),
    transaction_date TIMESTAMP,
    transaction_type VARCHAR(50) CHECK (transaction_type IN (
        'DEBIT', 'CREDIT', 'TRANSFER', 'ATM_WITHDRAWAL', 'ATM_DEPOSIT',
        'ONLINE_PURCHASE', 'MOBILE_PAYMENT', 'BILL_PAYMENT', 'EMI_PAYMENT',
        'INTEREST_CREDIT', 'SALARY_CREDIT', 'DIVIDEND_CREDIT', 'REFUND',
        'CHARGES', 'FEES'
    )),
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    merchant_name VARCHAR(255),
    account_number_last4 VARCHAR(4),
    card_last4 VARCHAR(4),
    transaction_id VARCHAR(255),
    reference_number VARCHAR(255),
    description TEXT,
    category_suggestion VARCHAR(100),
    raw_email_content TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP,
    created_transaction_id BIGINT,
    error_message TEXT,
    extracted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_email_message UNIQUE (email_account_id, email_message_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_extracted_transactions_email_account_id ON extracted_transactions(email_account_id);
CREATE INDEX idx_extracted_transactions_message_id ON extracted_transactions(email_message_id);
CREATE INDEX idx_extracted_transactions_transaction_date ON extracted_transactions(transaction_date);
CREATE INDEX idx_extracted_transactions_processed ON extracted_transactions(is_processed);
CREATE INDEX idx_extracted_transactions_sender_email ON extracted_transactions(sender_email);
CREATE INDEX idx_extracted_transactions_amount ON extracted_transactions(amount);
CREATE INDEX idx_extracted_transactions_confidence ON extracted_transactions(confidence_score);
CREATE INDEX idx_extracted_transactions_extracted_at ON extracted_transactions(extracted_at);

-- Create composite indexes for common queries
CREATE INDEX idx_extracted_transactions_unprocessed ON extracted_transactions(email_account_id, is_processed) 
    WHERE is_processed = false;
CREATE INDEX idx_extracted_transactions_recent ON extracted_transactions(transaction_date DESC, confidence_score DESC);

-- Add comments for documentation
COMMENT ON TABLE extracted_transactions IS 'Stores transaction data extracted from email messages';
COMMENT ON COLUMN extracted_transactions.email_message_id IS 'Unique identifier from email provider (Gmail Message ID, Outlook Message ID, etc.)';
COMMENT ON COLUMN extracted_transactions.confidence_score IS 'ML confidence score (0.0 to 1.0) for extraction accuracy';
COMMENT ON COLUMN extracted_transactions.is_processed IS 'Whether this extracted transaction has been converted to an actual transaction';
COMMENT ON COLUMN extracted_transactions.created_transaction_id IS 'Reference to the transaction created in transaction-service';
COMMENT ON COLUMN extracted_transactions.category_suggestion IS 'AI-suggested category based on merchant/description';