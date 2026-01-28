#!/bin/bash

# Fillo Development Setup and Launcher
# This script starts both backend and frontend with proper port allocation

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/agroconnect-backend"
FRONTEND_DIR="$PROJECT_DIR/agroconnect-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Fillo Development Server Launcher${NC}"
echo "============================================="
echo ""

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}⏹️  Shutting down servers...${NC}"
  pkill -f "npm run dev" 2>/dev/null || true
  pkill -f "ts-node-dev" 2>/dev/null || true
  pkill -f "next dev" 2>/dev/null || true
  sleep 1
  echo -e "${GREEN}✅ Servers stopped${NC}"
  exit 0
}

# Set up cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js is not installed${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}❌ npm is not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo ""

# Start Backend
echo -e "${YELLOW}📦 Starting Backend Server...${NC}"
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  Backend .env not found, creating from .env.example${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
  fi
fi

npm run dev > /tmp/agroconnect-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is ready at http://localhost:3001${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Backend failed to start. Check /tmp/agroconnect-backend.log${NC}"
    cat /tmp/agroconnect-backend.log
    exit 1
  fi
  sleep 1
done

echo ""

# Start Frontend
echo -e "${YELLOW}📦 Starting Frontend Server...${NC}"
cd "$FRONTEND_DIR"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}⚠️  Frontend .env.local not found, creating...${NC}"
  cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STACKS_NETWORK=testnet
EOF
fi

npm run dev > /tmp/agroconnect-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for frontend to be ready
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
for i in {1..30}; do
  if curl -s http://localhost:3000/ > /dev/null 2>&1 || \
     curl -s http://localhost:3003/ > /dev/null 2>&1; then
    FRONTEND_PORT=$(lsof -i -P -n | grep "next" | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
    if [ -z "$FRONTEND_PORT" ]; then
      FRONTEND_PORT=3003
    fi
    echo -e "${GREEN}✅ Frontend is ready at http://localhost:$FRONTEND_PORT${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Frontend failed to start. Check /tmp/agroconnect-frontend.log${NC}"
    cat /tmp/agroconnect-frontend.log
    exit 1
  fi
  sleep 1
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ All servers running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "📱 Frontend:  ${YELLOW}http://localhost:$FRONTEND_PORT${NC}"
echo -e "🔧 Backend:   ${YELLOW}http://localhost:3001${NC}"
echo -e "📚 API Docs:  ${YELLOW}http://localhost:3001/health${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep the script running
wait $BACKEND_PID $FRONTEND_PID
