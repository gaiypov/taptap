#!/bin/bash

# 360⁰ Marketplace - Complete Setup Script
# This script sets up all three repositories

set -e  # Exit on error

echo "🚀 Setting up 360⁰ Marketplace..."
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Backend setup
print_step "Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    print_step "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

cd ..
echo ""

# Mobile setup
print_step "Setting up mobile..."
cd mobile

if [ ! -d "node_modules" ]; then
    print_step "Installing mobile dependencies..."
    npm install
    print_success "Mobile dependencies installed"
else
    print_success "Mobile dependencies already installed"
fi

cd ..
echo ""

# Shared setup
print_step "Setting up shared..."
cd shared

if [ ! -d "node_modules" ]; then
    print_step "Installing shared dependencies..."
    npm install
    print_success "Shared dependencies installed"
else
    print_success "Shared dependencies already installed"
fi

print_step "Building shared package..."
npm run build 2>/dev/null || echo "Build skipped (no build script)"

cd ..
echo ""

# Create .env files if they don't exist
print_step "Creating .env files..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Please create backend/.env (see SETUP_GUIDE.md)"
fi

if [ ! -f "mobile/.env" ]; then
    echo "⚠️  Please create mobile/.env (see SETUP_GUIDE.md)"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure .env files (see SETUP_GUIDE.md)"
echo "2. Start backend:    cd backend && npm run dev"
echo "3. Start mobile:     cd mobile && npm start"
echo ""
echo "📚 For detailed setup instructions, see SETUP_GUIDE.md"

