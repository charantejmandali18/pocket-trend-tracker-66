# XPend Financial Management - Implementation Roadmap

## 🔧 Current Implementation Status

### ✅ Completed Features
- [x] Enhanced loan module with comprehensive home loan logic and EMI calculations
- [x] Dashboard networth calculation (assets - liabilities)
- [x] EMI/recurring payments module restoration
- [x] Edit/delete functionality for all account modules (Credit Cards, Investments, Insurance, Properties)
- [x] Comprehensive delete handlers for all modules
- [x] Enhanced dashboard with proper networth display

### 🚧 In Progress Features
- [ ] Group sharing functionality for all account types

## 📧 Email Integration & Transaction Extraction (Priority: HIGH)

### 1. Customer Service - Email Authentication
- [ ] **OAuth Integration Setup**
  - [ ] Gmail OAuth 2.0 integration (Google APIs)
  - [ ] Outlook OAuth 2.0 integration (Microsoft Graph API)
  - [ ] Yahoo OAuth 2.0 integration (Yahoo APIs)
  - [ ] Generic IMAP/POP3 support for other providers
  
- [ ] **Security & Token Management**
  - [ ] Secure token storage with encryption at rest
  - [ ] Token refresh mechanism implementation
  - [ ] Secure transit using HTTPS/TLS
  - [ ] Token rotation and expiry handling
  
- [ ] **Profile Page Enhancement**
  - [ ] Fix blank profile page loading issue
  - [ ] OAuth popup implementation for email authentication
  - [ ] Multiple email account management UI
  - [ ] Email account status display (connected/disconnected)
  - [ ] Email account removal functionality

### 2. Extraction Service - New Microservice
- [ ] **Service Architecture**
  - [ ] Create new Spring Boot extraction-service
  - [ ] Database schema for transaction extraction logs
  - [ ] Email processing queue implementation
  - [ ] Error handling and retry mechanisms
  
- [ ] **Email Processing Engine**
  - [ ] Email fetching from authenticated accounts
  - [ ] Transaction email pattern recognition
  - [ ] Bank/financial institution email templates
  - [ ] Transaction parsing algorithms
  - [ ] Duplicate transaction detection
  
- [ ] **Data Processing Pipeline**
  - [ ] Extract transaction details (amount, date, merchant, account)
  - [ ] Categorize transactions automatically
  - [ ] Map transactions to existing accounts
  - [ ] Create new accounts if detected from transactions
  - [ ] Update account balances automatically

### 3. Account Balance Automation
- [ ] **Bank Integration Research**
  - [ ] Open Banking APIs (PSD2 compliance)
  - [ ] Bank-specific APIs (HDFC, SBI, ICICI, etc.)
  - [ ] Screen scraping alternatives (Plaid-like solutions)
  - [ ] Account aggregation services
  
- [ ] **Balance Synchronization**
  - [ ] Real-time balance updates from transactions
  - [ ] Periodic balance reconciliation
  - [ ] Manual balance override capability
  - [ ] Balance history tracking

## 🏗️ Technical Implementation Details

### Database Schema Extensions

#### Customer Service - Email Authentication
```sql
-- Email Accounts Table
CREATE TABLE user_email_accounts (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    provider ENUM('GMAIL', 'OUTLOOK', 'YAHOO', 'OTHER') NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    token_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_email (user_id, email_address)
);

-- Token Encryption Keys
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY,
    key_type VARCHAR(50) NOT NULL,
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

#### Extraction Service Schema
```sql
-- Transaction Extraction Logs
CREATE TABLE transaction_extractions (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    email_account_id UUID NOT NULL,
    email_message_id VARCHAR(255),
    subject VARCHAR(500),
    sender VARCHAR(255),
    extracted_data JSON,
    transaction_id UUID, -- Links to created transaction
    status ENUM('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE') DEFAULT 'PENDING',
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Processing Queue
CREATE TABLE email_processing_queue (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    email_account_id UUID NOT NULL,
    priority INT DEFAULT 5,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP,
    status ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'QUEUED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Security Requirements
- [ ] **Encryption**
  - AES-256 encryption for stored tokens
  - Key rotation every 90 days
  - Separate encryption keys per user
  
- [ ] **OAuth Flow**
  - PKCE (Proof Key for Code Exchange) implementation
  - State parameter for CSRF protection
  - Scope limitation (read-only email access)
  
- [ ] **API Security**
  - Rate limiting for email processing
  - Request/response logging for audit
  - Token validation middleware

### API Endpoints to Implement

#### Customer Service
```
POST /api/customer/email-accounts/authenticate/{provider}
GET /api/customer/email-accounts
DELETE /api/customer/email-accounts/{id}
POST /api/customer/email-accounts/{id}/refresh-token
GET /api/customer/email-accounts/{id}/status
```

#### Extraction Service
```
POST /api/extraction/process-emails/{user_id}
GET /api/extraction/status/{user_id}
GET /api/extraction/transactions/{user_id}
POST /api/extraction/reprocess/{extraction_id}
```

## 🎯 Implementation Priority Order

### Phase 1: Foundation (Week 1)
1. Fix Profile page loading issue
2. Create extraction-service microservice structure
3. Implement basic OAuth popup functionality
4. Set up secure token storage infrastructure

### Phase 2: Email Authentication (Week 2)
1. Gmail OAuth integration
2. Outlook OAuth integration
3. Token refresh mechanism
4. Profile page email management UI

### Phase 3: Transaction Extraction (Week 3)
1. Email fetching and parsing engine
2. Transaction pattern recognition
3. Basic transaction creation from emails
4. Account balance update mechanism

### Phase 4: Advanced Features (Week 4)
1. Multiple email provider support
2. Automatic account creation from transactions
3. Bank balance fetching research and implementation
4. Error handling and retry mechanisms

### Phase 5: Production Readiness (Week 5)
1. Security audit and testing
2. Performance optimization
3. Monitoring and logging
4. Documentation and deployment

## 🔒 Security Considerations
- OAuth tokens encrypted at rest using AES-256
- TLS 1.3 for all API communications
- Token rotation every 30 days
- Audit logging for all email access
- Rate limiting to prevent abuse
- User consent management for data access

## 📊 Success Metrics
- 95%+ transaction extraction accuracy
- < 5 minute processing time for new emails
- 99.9% uptime for extraction service
- Zero security incidents
- 90%+ user satisfaction with automatic transaction entry

## 🚀 Future Enhancements
- ML-based transaction categorization
- Spending pattern analysis
- Budget recommendations based on transaction history
- Integration with investment platforms
- Receipt parsing from email attachments
- Multi-language transaction parsing support