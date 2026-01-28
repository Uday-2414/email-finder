# 🚀 Monorepo Deployment Guide - Backend + Frontend on Render

## Your Current Structure
```
Scrapper/  (GitHub repo root)
├── backend/
│   ├── package.json
│   ├── server.js
│   └── ...
└── frontend/
    ├── package.json
    ├── src/
    └── ...
```

**Challenge:** Render needs to know:
- Where is the backend code? (→ `/backend`)
- Where is the frontend code? (→ `/frontend`)
- What commands to run for each?

---

## ✅ Solution: Deploy as TWO Services

### Service 1: Backend API Server
- Name: `email-finder-backend`
- Runs on: `https://email-finder-backend.onrender.com`
- Command: `npm start` (from `/backend`)

### Service 2: Frontend Web App
- Name: `email-finder-frontend`
- Runs on: `https://email-finder-frontend.onrender.com`
- Command: `npm run build` then serves static files

---

## 🎯 STEP-BY-STEP DEPLOYMENT

### STEP 1: Create Backend Service

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" button (top right)
3. **Select**: "Web Service"
4. **Connect Repository**: Select your GitHub repo (`Scrapper`)
5. **Fill in these fields:**

```
Name:                  email-finder-backend
Runtime:               Node
Region:                (Choose closest to you)
Branch:                main
Build Command:         cd backend && npm install
Start Command:         cd backend && npm start
Root Directory:        (leave empty)
```

6. **Click "Create Web Service"**
7. **Wait for deployment** (usually 2-5 minutes)

---

### STEP 2: Add Environment Variables to Backend

After backend deploys:

1. **Go to Backend Service** → Click `email-finder-backend`
2. **Click "Settings"** (top right)
3. **Scroll to "Environment"**
4. **Add these variables:**

```
KEY:     NODE_ENV
VALUE:   production
```
Click "Save"

```
KEY:     FRONTEND_URL
VALUE:   https://email-finder-frontend.onrender.com
```
Click "Save"

5. **Redeploy:**
   - Click "Manual Deploy" dropdown
   - Select "Deploy Latest Commit"
   - Wait for ✅

---

### STEP 3: Create Frontend Service

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" button
3. **Select**: "Static Site" (NOT Web Service)
4. **Connect Repository**: Select your repo again
5. **Fill in:**

```
Name:              email-finder-frontend
Branch:            main
Root Directory:    frontend
Build Command:     npm install && npm run build
Publish Directory: build
```

6. **Click "Create Static Site"**
7. **Wait for deployment** (usually 2-3 minutes)

---

### STEP 4: Add Environment Variables to Frontend

After frontend deploys:

1. **Go to Frontend Service** → Click `email-finder-frontend`
2. **Click "Settings"** (top right)
3. **Scroll to "Environment"**
4. **Add this variable:**

```
KEY:     REACT_APP_API_URL
VALUE:   https://email-finder-backend.onrender.com
```
Click "Save"

5. **Redeploy:**
   - Click "Manual Deploy"
   - Select "Deploy Latest Commit"
   - Wait for ✅

---

## 📊 Complete Configuration Reference

### Backend Service (Web Service)

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | `email-finder-backend` |
| **Runtime** | Node |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && npm start` |
| **Root Directory** | (empty) |
| **Port** | (auto-assigned, uses PORT env var) |

**Environment Variables:**
```
NODE_ENV=production
FRONTEND_URL=https://email-finder-frontend.onrender.com
```

---

### Frontend Service (Static Site)

| Setting | Value |
|---------|-------|
| **Service Type** | Static Site |
| **Name** | `email-finder-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

**Environment Variables:**
```
REACT_APP_API_URL=https://email-finder-backend.onrender.com
```

---

## 🔄 How Render Finds Your Code

### For Backend:
```
Render sees: Build Command = "cd backend && npm install"
├─ Goes to repo root (Scrapper/)
├─ Runs: cd backend
├─ Then: npm install
├─ Installs from: backend/package.json ✅
└─ Starts with: cd backend && npm start
   └─ Runs: node server.js ✅
```

### For Frontend:
```
Render sees: Root Directory = "frontend"
├─ Looks in: Scrapper/frontend/
├─ Finds: frontend/package.json ✅
├─ Installs: npm install
├─ Builds: npm run build
├─ Creates: frontend/build/ folder
└─ Serves static files from build/ ✅
```

---

## ✅ Verification After Deployment

### 1. Check Backend is Running
```bash
# In browser or terminal:
curl https://email-finder-backend.onrender.com/health
# Should return: { "status": "ok" }
```

### 2. Check Frontend Loads
```bash
# In browser:
https://email-finder-frontend.onrender.com
# Should show your React app
```

### 3. Check API Connection
1. Open frontend in browser
2. Look for "API Health: ✅" indicator
3. Try to scrape a URL
4. Should work without errors

---

## 🚨 Common Issues & Solutions

### Issue: "Build failed: Cannot find package.json"
**Cause:** Render looking in wrong directory
**Solution:**
- Backend: Verify "Build Command" = `cd backend && npm install`
- Frontend: Verify "Root Directory" = `frontend`

### Issue: Backend deployment fails
**Cause:** Missing files or dependencies
**Solution:**
```bash
# Test locally first:
cd backend
npm install
npm start
# Should start on port 10000
```

### Issue: Frontend shows API error
**Cause:** `REACT_APP_API_URL` not set correctly
**Solution:**
1. Frontend Settings → Environment
2. Add `REACT_APP_API_URL=https://email-finder-backend.onrender.com`
3. Redeploy frontend
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: CORS error when frontend calls backend
**Cause:** `FRONTEND_URL` not set on backend
**Solution:**
1. Backend Settings → Environment
2. Add `FRONTEND_URL=https://email-finder-frontend.onrender.com`
3. Redeploy backend

---

## 📝 GitHub Push → Auto Deploy

After initial setup, deployment is automatic:

```bash
# From your local machine:
git add -A
git commit -m "Fix API configuration"
git push origin main

# Render automatically detects changes
# Both services redeploy within 2-3 minutes
# No manual intervention needed!
```

---

## 🎯 Quick Reference: What Goes Where

| Component | Location | Service Type | Deploys As |
|-----------|----------|--------------|-----------|
| **Backend (Node.js + Puppeteer)** | `backend/` | Web Service | API Server |
| **Frontend (React)** | `frontend/` | Static Site | Web App |
| **GitHub Repo** | Root folder | Blueprint | Both services |

---

## 💡 Why Two Services?

**You need two services because:**
1. ✅ Backend must run Node.js 24/7
2. ✅ Frontend must be served as static files
3. ✅ Different build processes
4. ✅ Different environment variables
5. ✅ Can scale independently
6. ✅ Easy to update each separately

**One service won't work because:**
- ❌ Can't run both Node server and static hosting simultaneously
- ❌ Different build pipelines
- ❌ Render needs separate configs for each

---

## 🔐 Environment Variables Checklist

### Backend Service Environment
- [ ] `NODE_ENV` = `production`
- [ ] `FRONTEND_URL` = Your frontend URL

### Frontend Service Environment
- [ ] `REACT_APP_API_URL` = Your backend URL

### Redeploy After Setting Variables
- [ ] Redeploy backend
- [ ] Redeploy frontend
- [ ] Test in browser

---

## 📊 Service Dashboard View

After deployment, you'll see in Render Dashboard:

```
Scrapper (GitHub Repo)
├── email-finder-backend (Web Service)
│   ├── Status: Live ✅
│   ├── URL: https://email-finder-backend.onrender.com
│   ├── Environment: NODE_ENV, FRONTEND_URL
│   └── Logs: Real-time stream
│
└── email-finder-frontend (Static Site)
    ├── Status: Live ✅
    ├── URL: https://email-finder-frontend.onrender.com
    ├── Environment: REACT_APP_API_URL
    └── Logs: Build logs
```

---

## 🚀 Full Deployment Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Create Backend Service | 1-2 min | Building |
| 2. Backend deploys | 2-5 min | Live ✅ |
| 3. Add Backend env vars | Instant | Ready |
| 4. Create Frontend Service | 1-2 min | Building |
| 5. Frontend deploys | 2-3 min | Live ✅ |
| 6. Add Frontend env vars | Instant | Ready |
| 7. Redeploy Backend | 1-2 min | Live ✅ |
| 8. Redeploy Frontend | 1-2 min | Live ✅ |
| **Total Time** | **~15-20 min** | **Done!** |

---

## 📞 Troubleshooting Commands

### Test Backend Locally
```bash
cd backend
npm install
npm start
# Should start on port 10000
# Visit: http://localhost:10000/health
```

### Test Frontend Locally
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:10000 npm start
# Should start on port 3000
```

### Check package.json Exists
```bash
# Backend
cat backend/package.json | head -5
# Frontend
cat frontend/package.json | head -5
```

---

## ✨ After Deployment

### What You'll Have
```
Your Live Application:
├─ Frontend: https://email-finder-frontend.onrender.com
├─ Backend API: https://email-finder-backend.onrender.com
├─ Auto-deployment: From GitHub push
├─ Monitoring: Render logs
└─ Support: Render dashboard
```

### What You Can Do
- ✅ Make changes locally
- ✅ Push to GitHub
- ✅ Services auto-redeploy
- ✅ No manual redeployment needed
- ✅ Monitor in Render dashboard

---

## 🎓 Next Steps

1. **Deploy Backend**
   - Create Web Service
   - Point to `backend/` folder
   - Add env vars

2. **Deploy Frontend**
   - Create Static Site
   - Point to `frontend/` folder
   - Add env vars

3. **Test Everything**
   - Check backend health
   - Check frontend loads
   - Try scraping

4. **Share URLs**
   - Send frontend URL to users
   - Backend is internal only

---

## 📚 File Reference

| File | Location | Purpose |
|------|----------|---------|
| `backend/package.json` | `Scrapper/backend/` | Backend dependencies |
| `backend/server.js` | `Scrapper/backend/` | Express server |
| `backend/.nvmrc` | `Scrapper/backend/` | Node 18 specification |
| `frontend/package.json` | `Scrapper/frontend/` | Frontend dependencies |
| `frontend/src/utils/api.js` | `Scrapper/frontend/src/` | API config |

---

**Last Updated**: January 28, 2026  
**Status**: ✅ Ready for Monorepo Deployment
