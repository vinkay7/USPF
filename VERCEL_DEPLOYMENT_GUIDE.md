# USPF Inventory Management - Vercel Deployment Guide

## Project Overview
This is a full-stack USPF Inventory Management PWA with:
- **Frontend**: React PWA with modern UI
- **Backend**: FastAPI serverless functions 
- **Database**: Supabase (already configured)

## Pre-Deployment Checklist

### 1. Environment Variables Required in Vercel
Set these environment variables in your Vercel dashboard:

```
SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY
```

### 2. Repository Structure
```
/
├── api/                    # Serverless API functions
│   ├── models.py          # Shared models and utilities
│   ├── requirements.txt   # Python dependencies
│   ├── auth/
│   │   ├── login.py      # Login endpoint
│   │   └── me.py         # User info endpoint
│   ├── inventory/
│   │   ├── index.py      # Get inventory
│   │   ├── create.py     # Create inventory item
│   │   └── [item_id]/
│   │       └── bin-card.py # BIN card history
│   ├── requisitions/
│   │   └── index.py      # Requisitions endpoints
│   ├── dashboard/
│   │   └── stats.py      # Dashboard statistics
│   ├── reports/
│   │   └── low-stock.py  # Low stock report
│   └── health.py         # Health check
├── frontend/              # React PWA
│   ├── public/
│   │   ├── index.html    # Updated for PWA
│   │   └── manifest.json # PWA manifest  
│   ├── src/              # React components
│   └── package.json      # With vercel-build script
└── vercel.json           # Vercel configuration

```

## Deployment Steps

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY  
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

### Method 2: Git Integration

1. **Push to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect Repository in Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Import your repository
   - Set framework preset to "Other"
   - Set build command to `cd frontend && yarn build`
   - Set output directory to `frontend/build`

3. **Configure Environment Variables**
   - In project settings, add the environment variables listed above

## API Endpoints Available

Once deployed, your API will be available at:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user  
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/{id}/bin-card` - Get BIN card history
- `GET /api/requisitions` - Get requisitions
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/reports/low-stock` - Low stock items
- `GET /api/health` - Health check

## Frontend Features

- ✅ PWA Configuration (manifest.json)
- ✅ Responsive Design with Tailwind CSS
- ✅ Authentication System
- ✅ Role-based Access Control
- ✅ Inventory Management UI
- ✅ QR Code Scanner Integration
- ✅ Requisition Management
- ✅ Dashboard with Analytics
- ✅ Offline Support Ready

## Default Login Credentials

```
Username: admin
Password: admin
```

## Troubleshooting

### Common Issues:

1. **API Not Working**
   - Check environment variables are set correctly
   - Verify API routes follow `/api/*` pattern

2. **Build Failures**
   - Ensure `frontend/package.json` has correct dependencies
   - Check Python requirements in `api/requirements.txt`

3. **CORS Issues**
   - CORS is configured in each API function
   - Check if frontend is making requests to correct endpoints

### Vercel Logs
```bash
vercel logs --follow
```

## Post-Deployment

1. **Test the application**
   - Visit your Vercel URL
   - Test login with admin/admin
   - Verify API endpoints work
   - Test PWA installation

2. **Custom Domain (Optional)**
   - Add custom domain in Vercel dashboard
   - Update DNS records as instructed

## Performance Optimizations

- ✅ Serverless functions for automatic scaling
- ✅ CDN distribution via Vercel
- ✅ Static asset optimization
- ✅ PWA caching strategies
- ✅ Code splitting in React

Your USPF Inventory Management System is now ready for production deployment on Vercel!