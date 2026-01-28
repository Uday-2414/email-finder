# 🔐 Environment Variables Setup Guide for Render

## Quick Overview

You need to set environment variables in **two separate services** on Render:
1. **Backend Service** (Node.js + Puppeteer)
2. **Frontend Service** (React)

---

## 📋 Environment Variables by Service

### **BACKEND SERVICE** (Node.js)

| Variable | Value | Required? | Example |
|----------|-------|-----------|---------|
| `NODE_ENV` | `production` | ✅ Yes | `production` |
| `PORT` | (Render sets automatically) | ❌ Optional | Auto-assigned |
| `FRONTEND_URL` | Your frontend Render URL | ✅ Yes | `https://email-finder-frontend.onrender.com` |

**Why these?**
- `NODE_ENV=production` → Optimizes Express for production
- `FRONTEND_URL` → CORS allows requests from frontend domain

### **FRONTEND SERVICE** (React)

| Variable | Value | Required? | Example |
|----------|-------|-----------|---------|
| `REACT_APP_API_URL` | Your backend Render URL | ✅ Yes | `https://email-finder-backend.onrender.com` |

**Why this?**
- Tells React where the backend API is located
- Build-time variable (must be set before building)

---

## 🎯 Step-by-Step Setup Instructions

### **STEP 1: Get Your Service URLs First**

After deploying both services on Render, you'll have two URLs:

```
Backend: https://email-finder-backend.onrender.com
Frontend: https://email-finder-frontend.onrender.com
```

If URLs are different, replace with your actual service names.

---

### **STEP 2: Set Backend Environment Variables**

#### Via Render Dashboard:

1. **Go to Render Dashboard** → https://dashboard.render.com
2. **Click Backend Service** → `email-finder-backend`
3. **Click "Settings"** (top right of service page)
4. **Scroll to "Environment"**
5. **Click "Add Environment Variable"**

#### Add These Variables:

**Variable 1: NODE_ENV**
```
Key:   NODE_ENV
Value: production
```
Click "Save"

**Variable 2: FRONTEND_URL**
```
Key:   FRONTEND_URL
Value: https://email-finder-frontend.onrender.com
```
(Replace with your actual frontend URL)
Click "Save"

#### Result:
```
NODE_ENV              = production
FRONTEND_URL          = https://email-finder-frontend.onrender.com
```

**Redeploy Backend:**
1. Click "Manual Deploy" dropdown (top right)
2. Select "Deploy Latest Commit"
3. Wait for deployment to complete ✅

---

### **STEP 3: Set Frontend Environment Variables**

#### Via Render Dashboard:

1. **Go to Render Dashboard** → https://dashboard.render.com
2. **Click Frontend Service** → `email-finder-frontend`
3. **Click "Settings"** (top right of service page)
4. **Scroll to "Environment"**
5. **Click "Add Environment Variable"**

#### Add This Variable:

**Variable 1: REACT_APP_API_URL**
```
Key:   REACT_APP_API_URL
Value: https://email-finder-backend.onrender.com
```
(Replace with your actual backend URL)
Click "Save"

#### Result:
```
REACT_APP_API_URL = https://email-finder-backend.onrender.com
```

**Redeploy Frontend:**
1. Click "Manual Deploy" dropdown (top right)
2. Select "Deploy Latest Commit"
3. Wait for deployment to complete ✅

---

## 🔄 Environment Variables Reference

### What Happens with These Variables?

**Backend receives `FRONTEND_URL`:**
```javascript
// In server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// ✅ Only allows requests from FRONTEND_URL
```

**Frontend receives `REACT_APP_API_URL`:**
```javascript
// In frontend/src/utils/api.js
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;  // ✅ Uses Render backend
  }
  // Fallback for local development
  return 'http://localhost:10000';
};
```

**Result:**
- ✅ Frontend calls backend securely
- ✅ CORS allows cross-origin requests
- ✅ No hardcoded localhost URLs

---

## 📊 Configuration Summary Table

| Service | Environment | Variables | Purpose |
|---------|-------------|-----------|---------|
| **Backend** | Production | `NODE_ENV`=`production` | Enable production mode |
| | | `FRONTEND_URL`=`https://...` | CORS security |
| **Frontend** | Production | `REACT_APP_API_URL`=`https://...` | API endpoint |

---

## ✅ Verification Checklist

After setting all variables, verify:

### Backend Health Check
```bash
curl https://email-finder-backend.onrender.com/health
# Should return: { "status": "ok" }
```

### Frontend Health Check
```bash
# In browser, visit:
https://email-finder-frontend.onrender.com
# Should show app with "API Health: ✅" indicator
```

### API Connection Test
1. Open frontend in browser
2. Try to scrape a URL
3. Should successfully call backend
4. ✅ No CORS errors

---

## 🚨 Common Issues & Solutions

### Issue: "CORS error from frontend"
**Solution:**
1. Check `FRONTEND_URL` is set on backend
2. Ensure URL matches frontend domain exactly
3. Redeploy backend
4. Hard refresh browser (Ctrl+Shift+R)

### Issue: "Cannot connect to API"
**Solution:**
1. Check `REACT_APP_API_URL` is set on frontend
2. Ensure URL matches backend domain exactly
3. Verify backend service is running
4. Redeploy frontend

### Issue: "API Health shows ❌"
**Solution:**
1. Backend service may be sleeping (free tier)
2. Click backend service to wake it up
3. Or wait 30 seconds and refresh
4. Check Render logs for errors

### Issue: Variables not taking effect
**Solution:**
1. Render caches environment variables
2. Must **redeploy** service after changing variables
3. Hard refresh frontend in browser (Ctrl+Shift+R)

---

## 🔐 Security Notes

### ✅ Safe to Share
These environment variables are **safe to share**:
- `NODE_ENV=production`
- `FRONTEND_URL=https://...`
- `REACT_APP_API_URL=https://...`

They're **public URLs** visible in browser anyway.

### 🔒 Keep Secret
If you had these, **don't share**:
- API keys (you don't have any)
- Database passwords (you don't have DB)
- OAuth secrets (you don't have)

---

## 📝 Local Development Setup

### To test locally, set these in `.env` files:

**backend/.env**
```
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:10000
```

Then run:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

Both will use local URLs instead of Render URLs.

---

## 🎯 Complete Render Setup Checklist

- [ ] Create Backend Service on Render
- [ ] Create Frontend Service on Render
- [ ] Wait for both to deploy
- [ ] Set `NODE_ENV=production` on Backend
- [ ] Set `FRONTEND_URL=https://...` on Backend
- [ ] Redeploy Backend
- [ ] Set `REACT_APP_API_URL=https://...` on Frontend
- [ ] Redeploy Frontend
- [ ] Test backend at `/health` endpoint
- [ ] Test frontend loads
- [ ] Test scraping works (no CORS errors)
- [ ] ✅ Success!

---

## 📞 Need Help?

### Check Render Logs
1. Service Dashboard → "Logs" tab
2. Look for any error messages
3. Common errors explained in "Issues" section above

### Verify Syntax
- ✅ URLs must start with `https://`
- ✅ No trailing slashes
- ✅ Match domain names exactly

### Redeploy is Key
After changing ANY environment variable:
1. Go to service settings
2. Click "Manual Deploy"
3. Select "Deploy Latest Commit"
4. Wait for ✅ "Live" status

---

**Last Updated**: January 28, 2026  
**Status**: ✅ Ready to Deploy
