# XPend Extraction Service

The Extraction Service automatically extracts transaction data from user email accounts and creates transactions in the XPend system.

## Features

### 🔐 Secure Email Authentication
- OAuth 2.0 integration for Gmail and Outlook
- AES-256 encrypted token storage with Jasypt
- Automatic token refresh mechanism
- Secure OAuth state management

### 📧 Email Processing
- Automated email scanning from bank and financial institutions
- Intelligent transaction detection using regex patterns
- Support for multiple Indian banks and payment platforms
- Confidence scoring for extraction accuracy

### 💳 Transaction Extraction
- Automatic transaction type detection (debit/credit/UPI/ATM)
- Merchant name and category suggestion
- Amount, date, and reference number extraction
- Account/card number identification (last 4 digits)

### 🤖 Auto-Transaction Creation
- High-confidence transactions automatically created
- Manual approval workflow for low-confidence extractions
- Account balance updates based on transactions
- Integration with transaction-service via REST APIs

### ⏰ Scheduled Processing
- Background email sync every 5 minutes
- Token refresh every hour
- Batch processing with configurable limits
- Parallel processing for multiple accounts

## API Endpoints

### Email Authentication
- `POST /api/email-auth/gmail/authorize` - Initiate Gmail OAuth
- `POST /api/email-auth/outlook/authorize` - Initiate Outlook OAuth
- `GET /api/email-auth/callback/{provider}` - OAuth callbacks
- `GET /api/email-auth/accounts` - Get connected accounts
- `DELETE /api/email-auth/accounts/{id}` - Disconnect account
- `POST /api/email-auth/accounts/{id}/sync` - Trigger manual sync

### Extraction Management
- `GET /api/extraction/transactions` - Get extracted transactions
- `GET /api/extraction/stats` - Get extraction statistics
- `POST /api/extraction/transactions/{id}/approve` - Approve/reject transaction
- `GET /api/extraction/accounts/{id}/history` - Account extraction history

## Configuration

### Required Environment Variables
```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/xpend_extraction
SPRING_DATASOURCE_USERNAME=xpend_user
SPRING_DATASOURCE_PASSWORD=xpend_password

# OAuth Credentials
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Security
ENCRYPTION_KEY=your-encryption-key-here
JWT_SECRET=your-jwt-secret-key-here

# Services
SERVICES_TRANSACTION_SERVICE_URL=http://localhost:8083
```

### OAuth Setup

#### Gmail API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8089/api/oauth2/callback/gmail`

#### Microsoft Graph Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add Mail.Read permission
4. Add redirect URI: `http://localhost:8089/api/oauth2/callback/outlook`

## Database Schema

### email_accounts
- Stores encrypted OAuth tokens
- User account associations
- Sync statistics and status

### extracted_transactions
- Raw transaction data from emails
- Confidence scores and processing status
- Links to created transactions

## Security Features

- **Encryption at Rest**: All OAuth tokens encrypted with AES-256
- **Encryption in Transit**: HTTPS for all OAuth flows
- **Token Management**: Automatic refresh and secure storage
- **Access Control**: JWT-based API authentication
- **Audit Trail**: Complete logging of all extraction activities

## Supported Banks & Platforms

- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank
- Paytm
- PhonePe
- Google Pay
- Razorpay
- And more...

## Development

### Building
```bash
cd extraction-service
./gradlew build
```

### Running
```bash
./gradlew bootRun
```

### Testing
```bash
./gradlew test
```

## Docker Deployment

The service is included in the main docker-compose.yml:

```bash
docker-compose up extraction-service
```

## Monitoring

- Application logs: `/app/logs/extraction-service.log`
- Health check: `GET /api/extraction/health`
- Metrics: Integration with Spring Boot Actuator

## Architecture

```
User Email → OAuth → Encrypted Storage → Scheduled Extraction → 
Pattern Matching → Confidence Scoring → Auto/Manual Approval → 
Transaction Creation → Account Balance Updates
```

The service follows microservices architecture with clear separation of concerns:
- Authentication layer for OAuth flows
- Processing layer for email extraction
- Storage layer with encrypted persistence
- Integration layer with other services