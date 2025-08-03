# 🔐 OAuth Setup Guide for Email Extraction

## Quick Setup Options

### Option 1: Interactive Setup (Recommended)
```bash
./setup-oauth.sh
```

### Option 2: Manual Environment Setup
```bash
# Copy the example file
cp config/.env.example config/.env

# Edit with your credentials
nano config/.env
```

### Option 3: Direct YAML Configuration
```bash
# Edit the OAuth config file
nano config/oauth-config.yml
```

---

## Getting OAuth Credentials

### 📧 Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:8089/api/email-auth/callback/gmail`
5. Copy the **Client ID** and **Client Secret**

### 📧 Outlook/Microsoft Graph Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration":
   - Name: "XPend Email Extraction"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:8089/api/email-auth/callback/outlook`
4. Add API permissions:
   - Go to "API permissions"
   - Add "Microsoft Graph" permissions:
     - `Mail.Read` (Application & Delegated)
     - `User.Read` (Delegated)
5. Generate client secret:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value immediately (it won't be shown again)
6. Copy the **Application (client) ID** and **Client Secret**

---

## Starting the Service

### Method 1: Using the Startup Script
```bash
./start-extraction-service.sh
```

### Method 2: Manual Gradle Run
```bash
cd xpend-backend/extraction-service
export GMAIL_CLIENT_ID="your-gmail-client-id"
export GMAIL_CLIENT_SECRET="your-gmail-client-secret"
export OUTLOOK_CLIENT_ID="your-outlook-client-id"
export OUTLOOK_CLIENT_SECRET="your-outlook-client-secret"
./gradlew bootRun
```

### Method 3: Docker Compose
```bash
# Make sure your .env file is in the config/ directory
docker-compose up extraction-service
```

---

## Verification

1. **Service Health Check**:
   ```bash
   curl http://localhost:8089/api/extraction/health
   ```

2. **Test OAuth Flow**:
   - Go to http://localhost:3000/profile
   - Click on "Email Accounts" tab
   - Try connecting Gmail or Outlook

3. **Check Logs**:
   ```bash
   tail -f xpend-backend/extraction-service/logs/extraction-service.log
   ```

---

## Troubleshooting

### Common Issues

1. **Connection Refused (Port 8089)**:
   - Make sure the extraction service is running
   - Check for port conflicts
   - Verify PostgreSQL is running

2. **OAuth Redirect Mismatch**:
   - Ensure redirect URIs match exactly in your OAuth app configuration
   - Check for trailing slashes or HTTP vs HTTPS

3. **Invalid Client Credentials**:
   - Verify your client ID and secret are correct
   - Make sure there are no extra spaces or characters

4. **Database Connection Failed**:
   - Start PostgreSQL: `docker-compose up postgres`
   - Check if extraction database exists

### Debug Mode
Add this to your configuration for more detailed logs:
```yaml
logging:
  level:
    com.xpend.extraction: DEBUG
    org.springframework.security: DEBUG
    org.springframework.oauth2: DEBUG
```

---

## Security Notes

- 🔒 OAuth credentials are stored in configuration files with restricted permissions (600)
- 🔐 All email tokens are encrypted using AES-256 before database storage
- 🛡️ JWT tokens are used for API authentication
- 📝 OAuth state parameters prevent CSRF attacks
- 🚫 Never commit OAuth credentials to version control

---

## Next Steps

Once the service is running:
1. Connect your email accounts via the Profile page
2. Wait for automatic transaction extraction (runs every 5 minutes)
3. Review extracted transactions in the dashboard
4. Approve/reject transactions as needed