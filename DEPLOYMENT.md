# Deployment Guide for Email Finder Scraper

## 🚀 Free Deployment on Render.com

### Prerequisites
- GitHub account with your code pushed
- Render.com account (free tier, no credit card required initially)

### Step-by-Step Deployment Guide

#### 1. Push Code to GitHub (Already Done ✅)
Your code is already pushed to: `https://github.com/Uday-2414/email-finder`

#### 2. Deploy on Render.com

**Option A: Automatic Deployment (Recommended)**

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub account
3. Click "New +" → "Blueprint"
4. Select "Connect Repository"
5. Search for "email-finder" repository
6. Select the repository
7. Render will automatically detect `render.yaml` configuration
8. Click "Deploy"
9. Wait for both services to build and deploy (5-10 minutes)

**Option B: Manual Deployment**

If automatic doesn't work:

1. Go to Render.com dashboard
2. Create Backend Service:
   - **Name**: email-finder-backend
   - **Repository**: Uday-2414/email-finder
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `FRONTEND_URL`: (will be provided after frontend deployment)
   - **Plan**: Free

3. Create Frontend Service:
   - **Name**: email-finder-frontend
   - **Repository**: Uday-2414/email-finder
   - **Branch**: main
   - **Runtime**: Static Site
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free

#### 3. Post-Deployment Configuration

1. After both services deploy, you'll get URLs:
   - Backend: `https://email-finder-backend.onrender.com`
   - Frontend: `https://email-finder-frontend.onrender.com`

2. Update Backend Environment Variable:
   - Go to Backend service settings
   - Update `FRONTEND_URL` to your Frontend URL
   - Deploy again

### ⚠️ Important Notes

**About Free Tier Limitations:**
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds
- No custom domains
- Limited RAM (512MB)

**For Production Use:**
- Upgrade to paid tier ($7/month minimum)
- Enables custom domains, persistent instances, more resources

### 🔍 Troubleshooting

**Issue: Build fails with "Puppeteer not found"**
- Solution: Ensure `puppeteer` is in dependencies (it is ✅)
- Render handles Puppeteer installation automatically

**Issue: "CORS errors" on frontend**
- Solution: Backend CORS is configured for production
- Make sure `FRONTEND_URL` environment variable is set correctly

**Issue: API calls timeout**
- Solution: Scraping can take time. Timeout is set to 60+ seconds
- This is normal for web scraping

### 📊 Monitoring

After deployment:
1. Go to Render dashboard
2. Check "Logs" tab for any errors
3. Test health endpoint: `https://email-finder-backend.onrender.com/api/health`
4. Visit frontend URL to test the application

### 🔄 Redeployment

To redeploy after code changes:
1. Push to GitHub (`main` branch)
2. Render automatically detects and deploys
3. Or manually trigger from Render dashboard

---

## Alternative Free Hosting Options

### 1. **Railway.app** (Good Alternative)
- Similar to Render
- Free tier with $5/month credit
- Good Puppeteer support
- https://railway.app

### 2. **Vercel** (Frontend only)
- Better for static sites
- Doesn't support Node.js backends on free tier
- Can be used for frontend only: https://vercel.com

### 3. **Heroku** (Legacy)
- Discontinued free tier
- Not recommended anymore

---

## Cost Analysis

| Platform | Cost | Notes |
|----------|------|-------|
| Render.com (Free) | $0 | Spins down after 15 min, 50s startup |
| Render.com (Pro) | $7/month | Always running, custom domain |
| Railway.app | $5 credit/month | Good for small projects |
| AWS Free Tier | $0 (12 months) | Complex setup, limited resources |

**Recommendation**: Start with Render.com free tier, upgrade to Pro ($7/month) when ready for production.

---

## Next Steps

1. ✅ Code is pushed to GitHub
2. 🔄 Go to Render.com and connect your repository
3. 🚀 Select "Blueprint" deployment
4. ⏳ Wait for build to complete
5. ✨ Share your deployed URL!

Your application will be live at: `https://email-finder-frontend.onrender.com`
