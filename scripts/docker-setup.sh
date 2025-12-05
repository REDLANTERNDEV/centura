#!/bin/bash

# ============================================
# Docker Quick Setup Script
# For Unix/Linux/MacOS/Git Bash
# ============================================

set -e

echo "🐳 Centura - Docker Setup"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.docker.example .env
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    
    # Update .env file with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secure-jwt-secret-key-here-at-least-256-bits-long/$JWT_SECRET/" .env
        sed -i '' "s/your-session-secret-key-here-different-from-jwt-also-256-bits/$SESSION_SECRET/" .env
        sed -i '' "s/your-super-secure-database-password-here/$DB_PASSWORD/" .env
    else
        # Linux
        sed -i "s/your-super-secure-jwt-secret-key-here-at-least-256-bits-long/$JWT_SECRET/" .env
        sed -i "s/your-session-secret-key-here-different-from-jwt-also-256-bits/$SESSION_SECRET/" .env
        sed -i "s/your-super-secure-database-password-here/$DB_PASSWORD/" .env
    fi
    
    echo "✅ .env file created with secure random secrets"
else
    echo "ℹ️  .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backups
mkdir -p logs

# Choose environment
echo ""
echo "Which environment do you want to start?"
echo "1) Development (with hot reload)"
echo "2) Production"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🚀 Starting Development Environment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
        ;;
    2)
        echo "🚀 Starting Production Environment..."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        echo ""
        echo "✅ Production environment started!"
        echo ""
        echo "Access your application at:"
        echo "  Frontend: http://localhost:4321"
        echo "  Backend:  http://localhost:8765"
        echo ""
        echo "View logs with: docker-compose logs -f"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
