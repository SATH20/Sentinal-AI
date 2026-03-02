# Deployment Guide

## Overview
- **Frontend**: Vercel (Next.js)
- **Backend**: Render (FastAPI/Python)
- **Database**: Supabase (already hosted)

---

## Step 1: Deploy Backend to Render

### 1.1 Push to GitHub
Make sure your code is pushed to a GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 1.2 Create Render Account
1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account

### 1.3 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `sento-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

### 1.4 Add Environment Variables
In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Gemini API key |
| `INSTAGRAM_ACCESS_TOKEN` | Your Instagram token |
| `INSTAGRAM_BUSINESS_ID` | Your Instagram Business ID |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `VERCEL_TOKEN` | Vercel API token |

### 1.5 Deploy
Click **"Create Web Service"** and wait for deployment.

Your backend URL will be: `https://sento-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI (optional)
```bash
npm i -g vercel
```

### 2.2 Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (root, not backend)

### 2.3 Add Environment Variables
In Vercel project settings → **Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://sento-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VERCEL_TOKEN` | Your Vercel token (for website deployments) |

### 2.4 Deploy
Click **"Deploy"** and wait for build to complete.

Your frontend URL will be: `https://your-project.vercel.app`

---

## Step 3: Update CORS (if needed)

If you get CORS errors, update `backend/api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-project.vercel.app",  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Troubleshooting

### Backend not starting on Render
- Check the **Logs** tab in Render dashboard
- Ensure all environment variables are set
- Verify `requirements.txt` has all dependencies

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Ensure backend is running (check Render dashboard)
- Check browser console for CORS errors

### Supabase connection issues
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase dashboard for connection limits

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python start_server.py
# or
uvicorn api.main:app --reload --port 8080
```

### Frontend
```bash
npm install
npm run dev
```

---

## Environment Variables Summary

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://sento-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
VERCEL_TOKEN=xxx
```

### Backend (Render Environment)
```
GEMINI_API_KEY=xxx
INSTAGRAM_ACCESS_TOKEN=xxx
INSTAGRAM_BUSINESS_ID=xxx
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_PUBLIC_URL=xxx
SUPABASE_URL=xxx
SUPABASE_KEY=xxx
VERCEL_TOKEN=xxx
```
