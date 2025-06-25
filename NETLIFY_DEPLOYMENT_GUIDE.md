# USPF Inventory Management - Netlify + Backend Hosting Guide

## Deployment Strategy
- **Frontend**: Netlify (Free tier, excellent for React apps)
- **Backend**: Railway/Render/Heroku (API hosting)
- **Database**: Supabase (already configured)

## Option 1: Netlify + Railway

### Step 1: Deploy Backend to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Backend Only**
   ```bash
   # From project root
   railway init
   railway add --service backend
   cd backend && railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co --service backend
   railway variables set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk --service backend
   railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDc2MjQxNSwiZXhwIjoyMDY2MzM4NDE1fQ.WlQ9-c9CGseHyhQto8v1y81hw9JNGKlsjjdj9n1gbMY --service backend
   ```

4. **Get Backend URL**
   Your backend will be available at: `https://your-backend.up.railway.app`

### Step 2: Deploy Frontend to Netlify

1. **Update Frontend Environment**
   Create `/app/frontend/.env.production`:
   ```env
   REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
   REACT_APP_SUPABASE_URL=https://auagpzfzeslimlrbrtga.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWdwemZ6ZXNsaW1scmJydGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI0MTUsImV4cCI6MjA2NjMzODQxNX0.Pqkd2CywPTSwxWHBxZwNpeePCVZwDlIu6nNT6dFrZNk
   ```

2. **Create netlify.toml**
   Create `/app/frontend/netlify.toml`:
   ```toml
   [build]
     base = "frontend"
     command = "yarn build"
     publish = "build"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "https://your-backend.up.railway.app/api/:splat"
     status = 200
     force = true

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [context.production.environment]
     REACT_APP_BACKEND_URL = "https://your-backend.up.railway.app"

   [[headers]]
     for = "/static/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

3. **Deploy to Netlify**

   **Option A: CLI Deployment**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy from frontend directory
   cd frontend
   netlify init
   netlify deploy --prod
   ```

   **Option B: Git Integration**
   - Push to GitHub
   - Go to https://netlify.com/
   - Click "New site from Git"
   - Connect your repository
   - Settings:
     - **Base directory**: `frontend`
     - **Build command**: `yarn build`
     - **Publish directory**: `frontend/build`

## Option 2: Netlify + Render

### Step 1: Deploy Backend to Render

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy backend to Render"
   git push origin main
   ```

2. **Create Backend Service on Render**
   - Go to https://render.com/
   - Click "New +" → "Web Service"
   - Connect your repository
   - Settings:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
     - **Add Environment Variables**

### Step 2: Deploy Frontend to Netlify
Follow the same Netlify steps as Option 1, but use your Render backend URL.

## Option 3: GitHub Pages + Backend Hosting

### Step 1: Setup GitHub Pages

1. **Create GitHub Pages Workflow**
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'yarn'
           cache-dependency-path: frontend/yarn.lock
       
       - name: Install dependencies
         run: cd frontend && yarn install
       
       - name: Build
         run: cd frontend && yarn build
         env:
           REACT_APP_BACKEND_URL: ${{ secrets.REACT_APP_BACKEND_URL }}
           REACT_APP_SUPABASE_URL: ${{ secrets.REACT_APP_SUPABASE_URL }}
           REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.REACT_APP_SUPABASE_ANON_KEY }}
       
       - name: Deploy to GitHub Pages
         uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: frontend/build
   ```

2. **Configure Repository Settings**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`

3. **Add Repository Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add secrets:
     - `REACT_APP_BACKEND_URL`
     - `REACT_APP_SUPABASE_URL`
     - `REACT_APP_SUPABASE_ANON_KEY`

### Step 2: Deploy Backend
Use Railway or Render as described above.

## Comparison of Options

| Option | Frontend | Backend | Cost | Complexity | Performance |
|--------|----------|---------|------|------------|-------------|
| Netlify + Railway | Free | $5-15/month | Medium | Excellent |
| Netlify + Render | Free | Free (with limits) | Low | Good |
| GitHub Pages + Railway | Free | $5-15/month | Low | Excellent |
| GitHub Pages + Render | Free | Free (with limits) | Low | Good |

## Recommended Configuration

### For Production (Best Performance):
**Netlify + Railway**
- ✅ Fastest frontend delivery (Netlify CDN)
- ✅ No cold starts on backend (Railway)
- ✅ Best developer experience
- ✅ Easy scaling

### For Development/Testing (Most Cost-Effective):
**Netlify + Render**
- ✅ Completely free (with limitations)
- ✅ Good for MVPs and prototypes
- ⚠️ Backend sleeps after 15 minutes (Render free tier)

## Custom Domain Setup

### Netlify:
1. Go to Netlify Dashboard → Domain settings
2. Add custom domain
3. Update DNS records as instructed
4. SSL is automatic

### Railway:
1. Go to Railway project → Domains
2. Add custom domain
3. Update DNS records
4. SSL is automatic

## Final URLs Structure

After deployment, you'll have:
- **Frontend**: `https://your-site.netlify.app` or custom domain
- **Backend**: `https://your-backend.up.railway.app` or `https://your-backend.onrender.com`
- **API Endpoints**: All accessible via `/api/*` through frontend proxy redirects

## Testing Your Deployment

1. **Health Check**
   ```bash
   curl https://your-backend.up.railway.app/api/health
   ```

2. **Login Test**
   ```bash
   curl -X POST https://your-backend.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'
   ```

3. **Frontend Test**
   - Visit your Netlify URL
   - Login with `admin` / `admin`
   - Verify all features work

---

**🌐 Your USPF Inventory Management System is now deployed across multiple platforms!**

**Default Login:** `admin` / `admin`

Choose the option that best fits your needs:
- **Production**: Netlify + Railway
- **Budget**: Netlify + Render
- **Simple**: GitHub Pages + Railway