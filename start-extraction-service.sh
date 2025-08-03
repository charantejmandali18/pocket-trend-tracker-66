#!/bin/bash

echo "🚀 Starting XPend Extraction Service"
echo "===================================="

# Check if config exists
if [ ! -f "config/oauth-config.yml" ] && [ ! -f "config/.env" ]; then
    echo "❌ No OAuth configuration found!"
    echo ""
    echo "Please run one of these commands first:"
    echo "1. Interactive setup: ./setup-oauth.sh"
    echo "2. Manual setup: Copy config/.env.example to config/.env and fill in your credentials"
    echo ""
    exit 1
fi

# Export environment variables if .env exists
if [ -f "config/.env" ]; then
    echo "📋 Loading environment variables from config/.env"
    export $(cat config/.env | grep -v '^#' | xargs)
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Please start PostgreSQL first:"
    echo "  docker-compose up postgres"
    echo ""
    exit 1
fi

# Create extraction database if it doesn't exist
echo "📊 Setting up extraction database..."
psql -h localhost -p 5432 -U xpend_user -d postgres -c "CREATE DATABASE xpend_extraction;" 2>/dev/null || true
psql -h localhost -p 5432 -U xpend_user -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE xpend_extraction TO xpend_user;" 2>/dev/null || true

echo "✅ Database setup complete"
echo ""

# Navigate to extraction service directory
cd xpend-backend/extraction-service

echo "🔨 Building extraction service..."
./gradlew build -x test

echo ""
echo "🌟 Starting extraction service on port 8089..."
echo "📝 Logs will appear below..."
echo ""

# Start the service
./gradlew bootRun