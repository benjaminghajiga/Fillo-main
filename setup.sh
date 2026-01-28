#!/bin/bash

# Fillo Quick Setup Script
# This script sets up the development environment

set -e

echo "🚀 Fillo Development Setup"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. You can still use a cloud database."
fi

echo "✅ Node.js $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd agroconnect-backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Update .env with your database credentials:"
    echo "   - DATABASE_URL"
    echo "   - PAYSTACK_SECRET_KEY (get from https://paystack.com)"
    echo "   - JWT_SECRET (generate a secure random string)"
    echo ""
fi

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../agroconnect-frontend

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Update .env.local with:"
    echo "   - NEXT_PUBLIC_API_URL (your backend URL)"
    echo ""
fi

echo "Installing dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

# Summary
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1️⃣  Backend Setup:"
echo "   cd agroconnect-backend"
echo "   # Edit .env with your database credentials"
echo "   npx prisma migrate dev --name init  # Initialize database"
echo "   npm run dev                          # Start backend"
echo ""
echo "2️⃣  Frontend Setup:"
echo "   cd agroconnect-frontend"
echo "   # Edit .env.local with your backend URL"
echo "   npm run dev                          # Start frontend"
echo ""
echo "3️⃣  Database Setup:"
echo "   - Local PostgreSQL: postgres://user:password@localhost:5432/agroconnect"
echo "   - Supabase: https://supabase.com"
echo "   - Neon: https://neon.tech"
echo ""
echo "4️⃣  Payment Gateway Setup:"
echo "   - Paystack: https://paystack.com/signup"
echo "   - Get API keys and update .env"
echo ""
echo "5️⃣  Stacks Blockchain (Optional for crypto payments):"
echo "   - Testnet faucet: https://testnet-faucet.alexgo.io/"
echo "   - Smart contract: See smart-contracts/DEPLOYMENT_GUIDE.md"
echo ""
echo "🌐 Access Points:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3000/api (or configured port)"
echo "   - API Health: http://localhost:3000/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - DEPLOYMENT.md - Production deployment guide"
echo "   - smart-contracts/DEPLOYMENT_GUIDE.md - Smart contract setup"
echo ""
echo "💡 Tips:"
echo "   - Use test Paystack keys (pk_test_, sk_test_) for development"
echo "   - Create test users in the frontend"
echo "   - Check API endpoints in backend/src/routes/"
echo "   - Monitor backend logs with: npm run dev"
echo ""
