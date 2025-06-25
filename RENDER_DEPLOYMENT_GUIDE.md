# USPF Inventory Management - Render Deployment Guide

## Why Render?
- **Full-stack deployment** in one platform
- **Persistent storage** for databases
- **Automatic HTTPS** and custom domains
- **Easy scaling** and monitoring
- **Free tier available**

## Pre-Deployment Setup

### 1. Prepare Your Repository
Ensure your project has these files:
- `render.yaml` (we'll create this)
- `requirements.txt` in root
- `package.json` with build scripts

### 2. Create render.yaml Configuration

Create `/app/render.yaml`:

```yaml
services:
  # Backend API Service
  - type: web
    name: uspf-inventory-api
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SUPABASE_URL
        value: https://auagpzfzeslimlrbrtga.supabase.co
      - key: SUPABASE_ANON_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY
      - key: PORT
        value: 8001

  # Frontend React App
  - type: web
    name: uspf-inventory-frontend
    env: static
    region: oregon
    plan: free
    buildCommand: cd frontend && yarn install && yarn build
    staticPublishPath: frontend/build
    pullRequestPreviewsEnabled: false
    routes:
      - type: rewrite
        source: /api/*
        destination: https://uspf-inventory-api.onrender.com/api/*
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  # Optional: PostgreSQL database (if you want to replace Supabase later)
  - name: uspf-inventory-db
    databaseName: uspf_inventory
    user: uspf_admin
    region: oregon
    plan: free
```

## Deployment Methods

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://render.com/
   - Sign up/Login with GitHub
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`

3. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for deployment (5-10 minutes)

### Method 2: Manual Service Creation

1. **Create Backend Service**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your repository
   - Settings:
     - **Name**: `uspf-inventory-api`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
     - **Add Environment Variables** (from above)

2. **Create Frontend Service**
   - Click "New +" → "Static Site"
   - Connect same repository
   - Settings:
     - **Name**: `uspf-inventory-frontend`
     - **Build Command**: `cd frontend && yarn install && yarn build`
     - **Publish Directory**: `frontend/build`

## Configuration Files Needed

### 1. Root requirements.txt
Create `/app/requirements.txt`:
```txt
fastapi==0.115.6
uvicorn==0.32.1
supabase==2.10.0
pydantic==2.10.4
python-multipart==0.0.18
qrcode==8.0
pillow==11.1.0
```

### 2. Update Frontend Environment
Update `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://uspf-inventory-api.onrender.com
REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
```

## Expected URLs After Deployment

- **Frontend**: `https://uspf-inventory-frontend.onrender.com`
- **Backend API**: `https://uspf-inventory-api.onrender.com`
- **Health Check**: `https://uspf-inventory-api.onrender.com/api/health`

## Advantages of Render

✅ **Benefits:**
- **Single Platform**: Both frontend and backend on one service
- **Automatic SSL**: HTTPS enabled by default
- **Free Tier**: Suitable for testing and small projects
- **Easy Scaling**: Upgrade plans as needed
- **Persistent Storage**: Can add PostgreSQL database
- **Automatic Deployments**: Updates on git push
- **Custom Domains**: Add your own domain easily

## Monitoring & Maintenance

### 1. View Logs
- Go to Render Dashboard
- Click on service name
- View "Logs" tab for real-time logs

### 2. Service Health
- Monitor uptime in Dashboard
- Set up alerts for downtime

### 3. Scaling
- Upgrade to paid plan for:
  - No sleep mode (free tier sleeps after 15 mins)
  - More RAM and CPU
  - Priority support

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check requirements.txt has all dependencies
   - Verify Python version compatibility

2. **Service Won't Start**
   - Check start command is correct
   - Verify environment variables are set

3. **Frontend Can't Connect to Backend**
   - Update `REACT_APP_BACKEND_URL` in frontend/.env
   - Check CORS settings in backend

4. **Slow Performance**
   - Free tier has limited resources
   - Consider upgrading to paid plan

## Cost Comparison

| Feature | Free Tier | Starter ($7/month) |
|---------|-----------|-------------------|
| Uptime | Sleeps after 15min | Always on |
| RAM | 512MB | 1GB |
| Build Time | 15min | 10min |
| Custom Domain | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

---

**🚀 Your USPF Inventory Management System is now ready for production on Render!**

**Login:** `admin` / `admin`
**Frontend:** `https://uspf-inventory-frontend.onrender.com`