# Deployment Guide for Render

## Prerequisites

1. A [Render](https://render.com) account
2. A [Facebook Developer](https://developers.facebook.com) app with Instagram permissions
3. A [Cloudflare R2](https://www.cloudflare.com/products/r2/) bucket
4. A [Google AI Studio](https://aistudio.google.com/) API key

## Quick Deploy with Render Blueprint

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repo
5. Render will detect `render.yaml` and create both services

## Manual Deployment

### Backend (Python FastAPI)

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name**: `sentinalai-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: Free (or paid for better performance)

4. Add Environment Variables:
   ```
   GEMINI_API_KEY=your_key
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   FACEBOOK_REDIRECT_URI=https://your-frontend-url.onrender.com/auth/callback
   R2_ACCOUNT_ID=your_r2_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key
   R2_SECRET_ACCESS_KEY=your_r2_secret
   R2_BUCKET_NAME=your_bucket
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   ```

5. Deploy

### Frontend (Next.js)

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Name**: `sentinalai-frontend`
   - **Root Directory**: `.` (root)
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Instance Type**: Free

4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://sentinalai-backend.onrender.com
   ```

5. Deploy

## Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app (Business type)
3. Add products:
   - Facebook Login
   - Instagram Basic Display
   - Instagram Graph API

4. Configure Facebook Login:
   - Valid OAuth Redirect URIs: `https://your-frontend-url.onrender.com/auth/callback`
   - Deauthorize Callback URL: (optional)

5. Request permissions:
   - `email`
   - `public_profile`
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_comments`
   - `instagram_manage_insights`
   - `business_management`

6. Submit for App Review (for production use)

## Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create a bucket
3. Enable public access (Settings → Public Access)
4. Create API token with R2 read/write permissions
5. Copy:
   - Account ID
   - Access Key ID
   - Secret Access Key
   - Public bucket URL

## Local Development with Docker

```bash
# Build and run both services
docker-compose up --build

# Or run separately
docker-compose up backend
docker-compose up frontend
```

## Environment Variables Reference

### Backend

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google AI Studio API key |
| `FACEBOOK_APP_ID` | Facebook App ID |
| `FACEBOOK_APP_SECRET` | Facebook App Secret |
| `FACEBOOK_REDIRECT_URI` | OAuth callback URL |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | R2 API secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public bucket URL |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Troubleshooting

### Backend not starting
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure Dockerfile builds successfully locally

### OAuth not working
- Verify `FACEBOOK_REDIRECT_URI` matches exactly
- Check Facebook App is in Live mode (not Development)
- Ensure all required permissions are approved

### Images not uploading
- Verify R2 credentials are correct
- Check bucket has public access enabled
- Ensure `R2_PUBLIC_URL` is correct

### Video generation slow
- Veo 2 video generation takes 30-60 seconds
- Consider upgrading to paid Render plan for better performance
