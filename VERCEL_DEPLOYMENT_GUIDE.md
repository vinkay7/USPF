# USPF Inventory Management - Vercel Deployment Guide

## 🚀 **Complete Vercel Deployment Instructions**

Your application has been updated with a robust JWT authentication system to fix the intermittent login issues. Follow these steps to deploy to Vercel:

---

## **📋 Prerequisites**
1. Vercel account
2. Git repository connected to Vercel
3. The Supabase credentials from your `.env` files

---

## **🔧 Step 1: Set Up Environment Variables in Vercel**

In your Vercel dashboard, go to your project settings and add these environment variables:

### **Required Environment Variables:**
```bash
# JWT Authentication
JWT_SECRET_KEY=uspf-inventory-jwt-secret-key-2025-production-secure

# Supabase Configuration  
SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY

# Frontend Environment Variables
REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk

# Build Configuration
GENERATE_SOURCEMAP=false
CI=false
BABEL_ENV=production
```

---

## **🎯 Step 2: Update Frontend Environment**

**IMPORTANT:** You need to update the `REACT_APP_BACKEND_URL` in your frontend `.env` file to point to your Vercel deployment URL.

1. After deploying, get your Vercel app URL (e.g., `https://your-app-name.vercel.app`)
2. Update `/frontend/.env` file:
```bash
REACT_APP_BACKEND_URL=https://your-app-name.vercel.app
```

---

## **🚀 Step 3: Deploy to Vercel**

### **Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (or Yes if you have one)
# - Project name: uspf-inventory-management
# - Directory: ./ (root)
```

### **Option B: Using Git Integration**
1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure build settings:
   - **Build Command:** `cd frontend && GENERATE_SOURCEMAP=false yarn install && yarn build`
   - **Output Directory:** `frontend/build`
   - **Install Command:** `cd frontend && yarn install`

---

## **⚙️ Step 4: Configure Build Settings**

Ensure your `vercel.json` is configured correctly (already done):
```json
{
  "version": 2,
  "buildCommand": "cd frontend && GENERATE_SOURCEMAP=false yarn install && yarn build",
  "outputDirectory": "frontend/build",
  "installCommand": "cd frontend && yarn install"
}
```

---

## **🔍 Step 5: Test Your Deployment**

After deployment:

1. **Test Login:** Go to `https://your-app-name.vercel.app`
2. **Use Credentials:** Username: `uspf`, Password: `uspf`  
3. **Verify Features:**
   - Login authentication
   - Dashboard loading
   - Inventory management
   - Token refresh (automatic)

---

## **🛠️ Step 6: Monitor and Debug**

### **Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on any API function to see logs
3. Monitor for any authentication or API errors

### **Test API Endpoints:**
- `https://your-app-name.vercel.app/api/health`
- `https://your-app-name.vercel.app/api/auth/login`
- `https://your-app-name.vercel.app/api/inventory`

---

## **🔧 Troubleshooting**

### **If Login Still Fails:**
1. Check Vercel environment variables are set correctly
2. Verify JWT_SECRET_KEY is the same across all functions
3. Check function logs for authentication errors
4. Ensure CORS headers are properly set

### **If API Calls Fail:**
1. Check Network tab in browser developer tools
2. Verify `REACT_APP_BACKEND_URL` points to your Vercel domain
3. Check API function logs in Vercel dashboard

---

## **✅ What's New in This Version**

### **Fixed Intermittent Login Issues:**
- ✅ **Proper JWT tokens** with 30-minute expiry
- ✅ **Automatic token refresh** before expiration
- ✅ **Retry logic** for failed network requests
- ✅ **Enhanced error handling** for serverless environments
- ✅ **Robust session management** for Vercel deployments

### **JWT Authentication Benefits:**
- No more static tokens that can become inconsistent
- Automatic recovery from network timeouts
- Proper token expiration and renewal
- Better debugging with comprehensive logging

---

## **🎉 Ready to Deploy!**

Your application is now ready for Vercel deployment with the enhanced JWT authentication system that will resolve the intermittent login issues you were experiencing.

**Next Steps:**
1. Set up environment variables in Vercel
2. Deploy using one of the methods above
3. Update the frontend backend URL
4. Test the login functionality
5. Monitor the deployment for any issues

The new authentication system should provide a much more stable login experience on Vercel! 🚀