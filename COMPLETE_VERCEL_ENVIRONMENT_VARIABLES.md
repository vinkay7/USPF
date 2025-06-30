# 🔑 COMPLETE VERCEL ENVIRONMENT VARIABLES - ALL REQUIRED FOR LOGIN

## 🚨 **CRITICAL: Set ALL these in your Vercel Dashboard**
**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

---

## **1. AUTHENTICATION & JWT (CRITICAL FOR LOGIN)**
```
JWT_SECRET_KEY=uspf-inventory-jwt-secret-key-2025-production-secure
```

---

## **2. SUPABASE DATABASE (REQUIRED)**
```
SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY
```

---

## **3. FRONTEND CONFIGURATION (UPDATE AFTER DEPLOYMENT)**
```
REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
```

### **🔥 CRITICAL: Set this AFTER your first deployment**
```
REACT_APP_BACKEND_URL=https://your-project-name.vercel.app
```
**Replace `your-project-name` with your actual Vercel project URL**

---

## **4. BUILD CONFIGURATION (RECOMMENDED)**
```
GENERATE_SOURCEMAP=false
CI=false
BABEL_ENV=production
NODE_ENV=production
```

---

## **5. OPTIONAL PERFORMANCE SETTINGS**
```
WDS_SOCKET_PORT=443
```

---

# 🚨 **LOGIN TROUBLESHOOTING**

## **✅ CORRECT LOGIN CREDENTIALS:**
- **Username:** `uspf`
- **Password:** `uspf`

## **❌ COMMON LOGIN ERRORS & FIXES:**

### **1. "Network Error" or "Failed to fetch"**
**CAUSE:** `REACT_APP_BACKEND_URL` is wrong or missing

**FIX:** 
1. Deploy first: `vercel --prod`
2. Get your URL: `https://your-project-name.vercel.app`
3. Set: `REACT_APP_BACKEND_URL=https://your-project-name.vercel.app`
4. Redeploy: `vercel --prod`

### **2. "Invalid username or password"**
**CAUSE:** Using wrong credentials

**FIX:** Use exactly `uspf` / `uspf` (case sensitive)

### **3. "JWT Error" or "Token Invalid"**
**CAUSE:** Missing or wrong `JWT_SECRET_KEY`

**FIX:** Set: `JWT_SECRET_KEY=uspf-inventory-jwt-secret-key-2025-production-secure`

### **4. "Internal Server Error"**
**CAUSE:** Missing Supabase environment variables

**FIX:** Set all SUPABASE_* variables listed above

---

# 📋 **STEP-BY-STEP DEPLOYMENT PROCESS**

## **Step 1: Set Environment Variables in Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add **ALL** variables listed above (except REACT_APP_BACKEND_URL - do this after deployment)

## **Step 2: Initial Deployment**
```bash
vercel --prod
```

## **Step 3: Update Backend URL**
1. After deployment, copy your Vercel URL (e.g., `https://my-project.vercel.app`)
2. In Vercel Dashboard → Settings → Environment Variables
3. Add: `REACT_APP_BACKEND_URL=https://your-actual-url.vercel.app`

## **Step 4: Redeploy with Backend URL**
```bash
vercel --prod
```

## **Step 5: Test Login**
1. Visit your deployed app
2. Login with: `uspf` / `uspf`
3. Should work perfectly!

---

# 🧪 **TEST YOUR DEPLOYMENT**

## **Test Login API Directly:**
```bash
curl -X POST https://your-project-name.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"uspf","password":"uspf"}'
```

**Expected Response:**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "user": {
    "username": "uspf",
    "role": "admin"
  }
}
```

## **Test Health Check:**
```bash
curl https://your-project-name.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "USPF Inventory Management API"
}
```

---

# ⚡ **QUICK CHECKLIST**

Before deploying, ensure you have:
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verified your vercel.json is clean (no routes conflicts)
- [ ] Your project is connected to Vercel
- [ ] You're using the correct login credentials: `uspf` / `uspf`

After first deployment:
- [ ] Updated `REACT_APP_BACKEND_URL` with your actual Vercel URL
- [ ] Redeployed with the updated backend URL
- [ ] Tested login functionality

---

**🎯 If you set ALL these environment variables correctly, your login will work perfectly!**

**Most common issue:** Missing or incorrect `REACT_APP_BACKEND_URL` - make sure to update this after your first deployment!