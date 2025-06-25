# USPF Inventory Management - Railway Deployment Guide

## Why Railway?
- **Fast deployment** (under 5 minutes)
- **Automatic HTTPS** and custom domains
- **Built-in databases** (PostgreSQL, MySQL, Redis)
- **Simple scaling** with usage-based pricing
- **Excellent developer experience**

## Pre-Deployment Setup

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

## Deployment Steps

### Method 1: CLI Deployment (Fastest)

1. **Initialize Railway Project**
   ```bash
   railway init
   ```
   - Select "Empty Project"
   - Name: `uspf-inventory-system`

2. **Deploy Backend**
   ```bash
   # From project root
   railway add --service backend
   railway up --service backend
   ```

3. **Deploy Frontend**
   ```bash
   railway add --service frontend
   railway up --service frontend
   ```

4. **Set Environment Variables**
   ```bash
   # Backend environment variables
   railway variables set SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co --service backend
   railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk --service backend
   railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY --service backend
   ```

### Method 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Railway"
   git push origin main
   ```

2. **Connect Repository**
   - Go to https://railway.app/
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Services**
   Railway will auto-detect and create services for both backend and frontend.

## Required Configuration Files

### 1. railway.json (Project Root)
Create `/app/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "always"
  }
}
```

### 2. Backend Configuration

Create `/app/backend/railway.json`:
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn server:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "always"
  }
}
```

### 3. Frontend Configuration

Create `/app/frontend/railway.json`:
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "yarn install && yarn build"
  },
  "deploy": {
    "startCommand": "npx serve -s build -l $PORT",
    "staticServeCommand": "npx serve -s build"
  }
}
```

### 4. Update Frontend Environment
Create `/app/frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://uspf-inventory-backend.up.railway.app
REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
```

## Environment Variables Setup

### Via CLI:
```bash
# Backend variables
railway variables set SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co --service backend
railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk --service backend
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY --service backend
```

### Via Dashboard:
- Go to Railway project dashboard
- Select backend service
- Go to "Variables" tab
- Add environment variables

## Expected URLs After Deployment

- **Frontend**: `https://uspf-inventory-frontend.up.railway.app`
- **Backend**: `https://uspf-inventory-backend.up.railway.app`
- **API Health**: `https://uspf-inventory-backend.up.railway.app/api/health`

## Railway Advantages

✅ **Benefits:**
- **Fastest deployment** among all platforms
- **Usage-based pricing** - pay only for what you use
- **No cold starts** - always warm
- **Built-in metrics** and monitoring
- **Easy database addition** (PostgreSQL, MySQL, Redis)
- **Custom domains** with automatic SSL
- **Git-based deployments** with automatic rollbacks

## Adding a Database (Optional)

If you want to replace Supabase with Railway's PostgreSQL:

```bash
# Add PostgreSQL database
railway add --service database --type postgresql

# Get database URL
railway variables --service backend
```

Then update your backend to use `DATABASE_URL` environment variable.

## Monitoring & Scaling

### 1. View Logs
```bash
railway logs --service backend
railway logs --service frontend
```

### 2. Monitor Usage
- Go to Railway Dashboard
- View metrics for CPU, Memory, Network usage
- Set up alerts for high usage

### 3. Scaling
Railway automatically scales based on usage, but you can set limits:
- Go to service settings
- Set resource limits (CPU, Memory)
- Configure autoscaling policies

## Custom Domain Setup

1. **Go to Service Settings**
2. **Click "Domains"**
3. **Add your custom domain**
4. **Update DNS records** as instructed
5. **Railway automatically provides SSL**

## Cost Estimate

Railway uses usage-based pricing:

| Resource | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| Execution Time | 500 hours/month | $10/month per GB-hour |
| Bandwidth | 100GB/month | $0.10/GB |
| Storage | 1GB | $0.25/GB/month |

**Typical monthly cost for small app: $5-15**

## CLI Commands Reference

```bash
# Project management
railway init                    # Initialize project
railway list                    # List projects
railway environment            # Manage environments

# Deployment
railway up                      # Deploy current directory
railway up --service backend   # Deploy specific service
railway redeploy               # Redeploy last deployment

# Variables
railway variables              # List all variables
railway variables set KEY=value # Set variable
railway variables unset KEY    # Remove variable

# Logs and monitoring
railway logs                   # View logs
railway logs --follow         # Follow logs in real-time
railway status                # View service status

# Database
railway connect               # Connect to database
railway database              # Database management commands
```

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check `requirements.txt` and `package.json`
   - Verify build commands in `railway.json`

2. **Environment Variables Not Working**
   - Restart service after setting variables: `railway redeploy`
   - Check variable names match your code

3. **Port Issues**
   - Railway provides `$PORT` environment variable
   - Ensure your app binds to `0.0.0.0:$PORT`

4. **Memory Issues**
   - Free tier has 512MB limit
   - Optimize your application or upgrade plan

### Getting Help:
- Railway Discord: https://discord.gg/railway
- Documentation: https://docs.railway.app/
- Status Page: https://status.railway.app/

---

**🚂 Your USPF Inventory Management System is now ready for production on Railway!**

**Login:** `admin` / `admin`
**Expected URL:** `https://uspf-inventory-frontend.up.railway.app`