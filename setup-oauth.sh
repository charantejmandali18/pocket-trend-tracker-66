#!/bin/bash

echo "🔐 XPend OAuth Configuration Setup"
echo "=================================="
echo ""

CONFIG_FILE="config/oauth-config.yml"

# Create config directory if it doesn't exist
mkdir -p config

echo "Please provide your OAuth credentials:"
echo ""

# Gmail credentials
read -p "📧 Gmail Client ID: " GMAIL_CLIENT_ID
read -s -p "🔑 Gmail Client Secret: " GMAIL_CLIENT_SECRET
echo ""

# Outlook credentials  
read -p "📧 Outlook Client ID: " OUTLOOK_CLIENT_ID
read -s -p "🔑 Outlook Client Secret: " OUTLOOK_CLIENT_SECRET
echo ""

# Security keys
echo "Generating secure encryption key..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Create the configuration file
cat > $CONFIG_FILE << EOF
# OAuth Configuration for Email Extraction Service
# Generated on $(date)

oauth:
  gmail:
    client-id: "${GMAIL_CLIENT_ID}"
    client-secret: "${GMAIL_CLIENT_SECRET}"
    redirect-uri: "http://localhost:8089/api/email-auth/callback/gmail"
    
  outlook:
    client-id: "${OUTLOOK_CLIENT_ID}"
    client-secret: "${OUTLOOK_CLIENT_SECRET}"
    redirect-uri: "http://localhost:8089/api/email-auth/callback/outlook"
    
  security:
    encryption-key: "${ENCRYPTION_KEY}"
    jwt-secret: "${JWT_SECRET}"

# Extraction Service Configuration
extraction:
  enabled: true
  batch-size: 50
  processing-interval: 300000 # 5 minutes
  max-emails-per-run: 1000
  auto-create-threshold: 0.8
EOF

echo ""
echo "✅ Configuration saved to: $CONFIG_FILE"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your OAuth apps have these redirect URIs:"
echo "   Gmail: http://localhost:8089/api/email-auth/callback/gmail"
echo "   Outlook: http://localhost:8089/api/email-auth/callback/outlook"
echo ""
echo "2. Start the extraction service:"
echo "   cd xpend-backend/extraction-service"
echo "   ./gradlew bootRun"
echo ""
echo "3. Or start with Docker:"
echo "   docker-compose up extraction-service"
echo ""

# Set proper permissions
chmod 600 $CONFIG_FILE
echo "🔒 Configuration file permissions set to 600 (owner read/write only)"