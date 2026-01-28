# 🔍 Debugging: Frontend Cannot Reach Backend

## Quick Diagnosis

When frontend shows "Backend is Offline", it means:
- Frontend is running ✅
- Backend is running ✅  
- But frontend **can't connect** to backend ❌

---

## 🎯 Step 1: Check Your Service URLs

### Go to Render Dashboard
1. https://dashboard.render.com
2. You should see **two services**:
   - `email-finder-backend` (Web Service)
   - `email-finder-frontend` (Static Site)

### Get the URLs
```
Backend URL:  https://email-finder-backend.onrender.com
Frontend URL: https://email-finder-frontend.onrender.com
```

**⚠️ YOUR URLS WILL BE DIFFERENT!** Replace with your actual service names.

---

## 🔧 Step 2: Test Backend Directly

### Open in Browser
```
https://email-finder-backend.onrender.com/health
```

You should see:
```json
{ "status": "ok" }
```

**If you don't see this:**
- Backend service is sleeping (free tier)
- Click on backend service to wake it up
- Or wait 30 seconds and try again

---

## 🔧 Step 3: Check Frontend Environment Variables

### Go to Frontend Service Settings
1. Render Dashboard → Click `email-finder-frontend`
2. Click "Settings" (top right)
3. Scroll to "Environment"
4. **Look for**: `REACT_APP_API_URL`

### What You Should See
```
REACT_APP_API_URL = https://email-finder-backend.onrender.com
```

**If it's missing:**
1. Click "Add Environment Variable"
2. Set:
   ```
   KEY:   REACT_APP_API_URL
   VALUE: https://email-finder-backend.onrender.com
   ```
3. Click "Save"
4. Click "Manual Deploy" → "Deploy Latest Commit"
5. Wait for ✅ "Live" status

---

## 🔧 Step 4: Check Browser Console for Errors

### Open Frontend in Browser
1. Go to: `https://email-finder-frontend.onrender.com`
2. Press `F12` (Open Developer Tools)
3. Click "Console" tab
4. Look for **red errors**

### Common Errors

**Error: "Failed to fetch"**
```
Reason: Frontend can't reach backend URL
Solution: 
- Check REACT_APP_API_URL in frontend environment
- Make sure backend service is running
- Redeploy frontend
```

**Error: "CORS policy blocked"**
```
Reason: Backend CORS settings wrong
Solution:
- Check FRONTEND_URL in backend environment
- Verify it matches your frontend URL exactly
- Redeploy backend
```

**Error: "ERR_INVALID_URL"**
```
Reason: API URL is malformed
Solution:
- Check REACT_APP_API_URL is a valid URL
- Must start with https://
- No trailing slash
```

---

## 🧪 Step 5: Manual API Test

### From Browser Console

Open DevTools (F12) → Console, paste this:

```javascript
// Test if backend is reachable
fetch('https://email-finder-backend.onrender.com/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend OK:', data))
  .catch(err => console.error('❌ Backend Error:', err.message))
```

**Expected Output:**
```
✅ Backend OK: { status: "ok" }
```

**If you see error:**
- Backend service URL is wrong
- Backend service is sleeping
- Network issue

---

## 📋 Complete Verification Checklist

### Backend Service
- [ ] Go to Render Dashboard
- [ ] Click `email-finder-backend`
- [ ] Status shows "Live ✅"
- [ ] Click service to wake if sleeping
- [ ] Test `/health` endpoint in browser
- [ ] Should return `{ "status": "ok" }`

### Backend Environment Variables
- [ ] Settings → Environment
- [ ] Has `NODE_ENV` = `production`
- [ ] Has `FRONTEND_URL` = your frontend URL
- [ ] Recently redeployed ✅

### Frontend Service
- [ ] Go to Render Dashboard
- [ ] Click `email-finder-frontend`
- [ ] Status shows "Live ✅"
- [ ] Can open in browser

### Frontend Environment Variables
- [ ] Settings → Environment
- [ ] Has `REACT_APP_API_URL` = your backend URL
- [ ] URL is correct (https://, no trailing slash)
- [ ] Recently redeployed ✅

### Browser Test
- [ ] Open frontend URL
- [ ] Open Developer Console (F12)
- [ ] Check for red errors
- [ ] Run fetch test from console
- [ ] Should connect to backend

---

## 🚨 Most Common Issues

### Issue 1: Wrong Backend URL in Environment Variable

**Problem:** Frontend trying to reach wrong URL

**Check:**
```bash
# Frontend Settings → Environment
REACT_APP_API_URL = ???
```

Should be:
```
https://email-finder-backend.onrender.com
```

(Replace with YOUR actual backend service name)

**Fix:**
1. Go to Frontend Service → Settings → Environment
2. Find `REACT_APP_API_URL`
3. Click edit (pencil icon)
4. Change to correct backend URL
5. Save
6. Manual Deploy

---

### Issue 2: Backend Service Sleeping

**Problem:** Free tier services sleep after 15 minutes of inactivity

**Check:**
```bash
# Try this in browser:
https://email-finder-backend.onrender.com/health

# Takes 30+ seconds to respond, then fails?
# Backend is sleeping!
```

**Fix:**
1. Go to Backend Service dashboard
2. Click on it (this wakes it up)
3. Wait 30 seconds
4. Try health check again
5. Should work now

---

### Issue 3: Mismatch Between Frontend & Backend URLs

**Problem:**
- Frontend tries to reach `https://example-backend.onrender.com`
- But backend is actually at `https://example-api.onrender.com`

**Check:**
1. Frontend env: `REACT_APP_API_URL`
2. Backend service name from dashboard
3. Do they match?

**Fix:** Make sure they're identical

---

### Issue 4: FRONTEND_URL Not Set on Backend

**Problem:** Backend CORS rejecting frontend requests

**Check:**
```bash
# Backend Settings → Environment
FRONTEND_URL = ???
```

Should be:
```
https://email-finder-frontend.onrender.com
```

(Replace with YOUR actual frontend service name)

**Fix:**
1. Go to Backend Service → Settings → Environment
2. Find `FRONTEND_URL` (or add if missing)
3. Set to your frontend URL
4. Save
5. Manual Deploy

---

## 🎯 Step-by-Step Fix

### If Backend Shows Offline:

1. **Open Backend URL directly**
   ```
   https://email-finder-backend.onrender.com/health
   ```
   - Wait 30 seconds if loading
   - Should return `{ "status": "ok" }`

2. **Check Frontend Environment Variable**
   - Render → Frontend Service → Settings → Environment
   - Find `REACT_APP_API_URL`
   - Should equal your backend URL

3. **If Missing or Wrong:**
   - Add/update `REACT_APP_API_URL`
   - Set to backend URL
   - Save
   - Manual Deploy Frontend

4. **Check Backend Environment Variable**
   - Render → Backend Service → Settings → Environment
   - Find `FRONTEND_URL`
   - Should equal your frontend URL

5. **If Missing or Wrong:**
   - Add/update `FRONTEND_URL`
   - Set to frontend URL
   - Save
   - Manual Deploy Backend

6. **Test in Browser**
   ```
   F12 → Console
   fetch('https://your-backend.onrender.com/health')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

7. **Refresh Frontend**
   - Go to frontend URL
   - Hard refresh: `Ctrl+Shift+R`
   - Should show "API Health ✅"

---

## 📊 Quick Reference

| What You See | What It Means | Solution |
|--------------|--------------|----------|
| "Backend is Offline" | Can't reach backend | Check `REACT_APP_API_URL` env var |
| CORS Error | Frontend & Backend not talking | Check `FRONTEND_URL` on backend |
| 404 Not Found | Wrong backend URL | Verify backend service name |
| 30+ sec load time | Backend sleeping | Click backend service to wake |
| Connection refused | Backend not running | Check backend logs |

---

## 🔗 Your Service URLs

**Find these in Render Dashboard:**

```
Frontend:  https://email-finder-frontend.onrender.com
           (or whatever your service name is)

Backend:   https://email-finder-backend.onrender.com
           (or whatever your service name is)
```

**Then set environment variables to match:**

Frontend Settings:
```
REACT_APP_API_URL = [your backend URL]
```

Backend Settings:
```
FRONTEND_URL = [your frontend URL]
```

---

## ✅ Success Indicators

When it's working:
- ✅ Frontend loads without errors
- ✅ Opens to home page
- ✅ Shows "API Health: ✅"
- ✅ Can enter a URL and scrape
- ✅ Results appear without CORS errors

---

## 📞 Still Not Working?

### Share These Details:
1. Your **Frontend URL** (from Render dashboard)
2. Your **Backend URL** (from Render dashboard)
3. **Screenshot of Frontend Service Environment Variables**
4. **Screenshot of Backend Service Environment Variables**
5. **Error message from Browser Console** (F12)
6. **Backend logs** (from Render dashboard)

With this info, I can pinpoint the exact issue!

---

**Last Updated**: January 28, 2026
