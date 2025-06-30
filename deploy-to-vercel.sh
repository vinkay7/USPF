#!/bin/bash

# USPF Inventory Management - Vercel Deployment Script
# This script helps prepare your application for Vercel deployment

echo "🚀 USPF Inventory Management - Vercel Deployment Preparation"
echo "============================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Checking project structure...${NC}"

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

if [ ! -d "frontend" ] || [ ! -d "api" ]; then
    echo -e "${RED}❌ Error: frontend or api directory not found.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project structure looks good!${NC}"
echo ""

# Check if frontend dependencies are installed
echo -e "${BLUE}📦 Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing frontend dependencies...${NC}"
    cd frontend && yarn install && cd ..
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed!${NC}"
    else
        echo -e "${RED}❌ Failed to install frontend dependencies.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Frontend dependencies already installed!${NC}"
fi
echo ""

# Test frontend build
echo -e "${BLUE}🔨 Testing frontend build...${NC}"
cd frontend
GENERATE_SOURCEMAP=false yarn build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful!${NC}"
    # Clean up build directory to save space
    rm -rf build
else
    echo -e "${RED}❌ Frontend build failed. Please check for errors.${NC}"
    cd ..
    exit 1
fi
cd ..
echo ""

# Check Python dependencies for API functions
echo -e "${BLUE}🐍 Checking Python dependencies...${NC}"
python3 -c "import jwt, qrcode, PIL" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python dependencies available!${NC}"
else
    echo -e "${YELLOW}⚠️  Some Python dependencies may be missing, but Vercel will install them automatically.${NC}"
fi
echo ""

# Display environment variables reminder
echo -e "${BLUE}🔐 Environment Variables Checklist:${NC}"
echo "Make sure to set these in your Vercel dashboard:"
echo ""
echo "Required Environment Variables:"
echo "- JWT_SECRET_KEY=uspf-inventory-jwt-secret-key-2025-production-secure"
echo "- SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co"
echo "- SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]"
echo "- REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co"
echo "- REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]"
echo "- GENERATE_SOURCEMAP=false"
echo "- CI=false" 
echo "- BABEL_ENV=production"
echo ""

# Create deployment checklist
echo -e "${BLUE}📋 Deployment Checklist:${NC}"
echo "□ 1. Set up environment variables in Vercel dashboard"
echo "□ 2. Connect your Git repository to Vercel"
echo "□ 3. Configure build settings (already done in vercel.json)"
echo "□ 4. Deploy to Vercel"
echo "□ 5. Update REACT_APP_BACKEND_URL with your Vercel domain"
echo "□ 6. Test login with uspf/uspf credentials"
echo ""

# Deployment commands
echo -e "${BLUE}🚀 Deployment Commands:${NC}"
echo ""
echo "Option 1 - Vercel CLI:"
echo "  npm i -g vercel"
echo "  vercel login"
echo "  vercel"
echo ""
echo "Option 2 - Git Integration:"
echo "  git add ."
echo "  git commit -m 'Deploy USPF Inventory with JWT authentication'"
echo "  git push origin main"
echo "  (Then import in Vercel dashboard)"
echo ""

# Final success message
echo -e "${GREEN}🎉 Your application is ready for Vercel deployment!${NC}"
echo ""
echo -e "${YELLOW}📖 For detailed instructions, see: VERCEL_DEPLOYMENT_GUIDE.md${NC}"
echo ""
echo -e "${BLUE}🔧 Key Improvements Made:${NC}"
echo "✅ JWT authentication with 30-min access tokens"
echo "✅ Automatic token refresh and retry logic"
echo "✅ Enhanced error handling for serverless environments"
echo "✅ Robust session management for Vercel deployments"
echo "✅ Individual API functions for Vercel compatibility"
echo ""
echo -e "${GREEN}This should fix your intermittent login issues on Vercel! 🚀${NC}"