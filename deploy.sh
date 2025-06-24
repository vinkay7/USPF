#!/bin/bash

echo "🚀 Preparing USPF Inventory Management for Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "📦 Installing frontend dependencies..."
cd frontend
yarn install
cd ..

echo "🔧 Building frontend for production..."
cd frontend
yarn build
cd ..

echo "✅ Project is ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Run 'vercel login' to authenticate"
echo "2. Run 'vercel --prod' to deploy"
echo "3. Set environment variables in Vercel dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"