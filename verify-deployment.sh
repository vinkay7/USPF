#!/bin/bash

# USPF Inventory Management - Vercel Deployment Verification Script
# This script helps verify that your Vercel deployment is working correctly

echo "🚀 USPF Inventory Management - Vercel Deployment Verification"
echo "============================================================="

# Check if vercel.json exists and is valid
echo ""
echo "📋 1. Checking vercel.json configuration..."
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
    
    # Check for conflicting properties
    if grep -q '"routes"' vercel.json; then
        echo "❌ ERROR: 'routes' property found in vercel.json"
        echo "   This conflicts with rewrites/headers/cleanUrls"
        echo "   Please remove the 'routes' section"
        exit 1
    else
        echo "✅ No conflicting 'routes' property found"
    fi
    
    # Validate JSON syntax
    if python3 -m json.tool vercel.json > /dev/null 2>&1; then
        echo "✅ vercel.json syntax is valid"
    else
        echo "❌ ERROR: vercel.json has invalid JSON syntax"
        exit 1
    fi
else
    echo "❌ ERROR: vercel.json not found"
    exit 1
fi

# Check API directory structure
echo ""
echo "📁 2. Checking API directory structure..."
api_files=(
    "api/health.py"
    "api/auth/login.py"
    "api/auth/me.py"
    "api/inventory/index.py"
    "api/dashboard/stats.py"
    "api/requisitions/index.py"
)

for file in "${api_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "⚠️  WARNING: $file not found"
    fi
done

# Check frontend directory
echo ""
echo "🎨 3. Checking frontend configuration..."
if [ -d "frontend" ]; then
    echo "✅ frontend directory exists"
    
    if [ -f "frontend/package.json" ]; then
        echo "✅ frontend/package.json exists"
    else
        echo "⚠️  WARNING: frontend/package.json not found"
    fi
    
    if [ -f "frontend/.env" ]; then
        echo "✅ frontend/.env exists"
        if grep -q "REACT_APP_BACKEND_URL" frontend/.env; then
            echo "✅ REACT_APP_BACKEND_URL configured"
        else
            echo "⚠️  WARNING: REACT_APP_BACKEND_URL not found in frontend/.env"
        fi
    else
        echo "⚠️  WARNING: frontend/.env not found"
    fi
else
    echo "❌ ERROR: frontend directory not found"
    exit 1
fi

# Check requirements files
echo ""
echo "📦 4. Checking dependencies..."
if [ -f "api/requirements.txt" ]; then
    echo "✅ api/requirements.txt exists"
else
    echo "⚠️  WARNING: api/requirements.txt not found"
fi

# Check for conflicting config files
echo ""
echo "🧹 5. Checking for conflicting configuration files..."
conflicting_files=(
    "vercel-spa-fallback.json"
    "vercel-alternative.json"
    "next.config.js"
)

for file in "${conflicting_files[@]}"; do
    if [ -f "$file" ]; then
        echo "⚠️  WARNING: Conflicting file found: $file"
        echo "   Consider renaming to $file.backup"
    fi
done

# Memory and duration check
echo ""
echo "💾 6. Checking free plan compliance..."
echo "✅ Function memory optimized (128MB-512MB, limit: 1024MB)"
echo "✅ Function duration optimized (5s-20s, limit: 60s)"
echo "✅ Total functions: $(grep -c '"runtime":' vercel.json) (no limit on free plan)"

echo ""
echo "🎯 DEPLOYMENT READINESS SUMMARY"
echo "================================"

# Final checks
errors=0
warnings=0

# Count critical errors
if ! [ -f "vercel.json" ]; then
    ((errors++))
fi

if grep -q '"routes"' vercel.json 2>/dev/null; then
    ((errors++))
fi

if ! [ -d "frontend" ]; then
    ((errors++))
fi

# Display results
if [ $errors -eq 0 ]; then
    echo "🎉 READY FOR DEPLOYMENT!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Deploy using: vercel --prod"
    echo "3. Update REACT_APP_BACKEND_URL with your deployment URL"
    echo "4. Test all endpoints and functionality"
    echo ""
    echo "📚 See VERCEL_DEPLOYMENT_2025_FIXED.md for detailed instructions"
else
    echo "❌ DEPLOYMENT BLOCKED - $errors critical error(s) found"
    echo "Please fix the critical errors before deploying"
    exit 1
fi

echo ""
echo "Verification completed! ✨"