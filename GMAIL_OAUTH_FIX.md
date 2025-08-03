# Gmail OAuth Configuration Fix

## Problem
Gmail OAuth is failing with **401 Unauthorized** error during token exchange. The issue is a redirect URI mismatch between Google Console configuration and what the application is using.

## Required Google Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID: `629809071861-nulh6u2fb1bcrm3emcmdbl0ecgj5fv3n.apps.googleusercontent.com`
4. Edit the OAuth client
5. Add this EXACT redirect URI to "Authorized redirect URIs":
   ```
   http://localhost:8089/api/email-auth/callback/gmail
   ```

## Current Configuration
- **Client ID**: `629809071861-nulh6u2fb1bcrm3emcmdbl0ecgj5fv3n.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Required Redirect URI**: `http://localhost:8089/api/email-auth/callback/gmail`
- **Scopes**: `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/userinfo.email`

## Verification Steps
1. Add the redirect URI to Google Console
2. Test the OAuth flow by clicking "Connect Gmail" in the frontend
3. Check if the email account gets stored in the database

## Test Command
```bash
# Test the authorization endpoint
curl -X POST "http://localhost:8089/api/email-auth/gmail/authorize" -H "Content-Type: application/json"

# Check if email accounts are stored after successful auth
docker exec xpend-postgres psql -U xpend_user -d xpend_extraction -c "SELECT id, provider, email_address, is_active, created_at FROM email_accounts;"
```

## Database Location
Email accounts are stored in the `xpend_extraction` database in the `email_accounts` table.