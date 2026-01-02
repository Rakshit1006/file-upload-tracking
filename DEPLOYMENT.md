# Deployment Guide

This guide covers deploying the File Upload application to make it publicly accessible.

## ✅ Error Fixed

The error you encountered was because Next.js Server Components can't pass event handlers to Client Components. I fixed this by adding `'use client';` to the top of `page.tsx`.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Frontend) + Railway/Render (Backend)

#### Frontend Deployment (Vercel)

1. **Push to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com`

#### Backend Deployment (Railway/Render)

**Railway:**

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Set root directory to `backend`
4. Add environment variables:
   ```
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id
   PORT=3001
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
5. Upload `service-account.json` as a file (Railway supports this)

**Render:**

1. Go to [render.com](https://render.com)
2. Create New Web Service
3. Connect GitHub repo
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add same environment variables

### Option 2: Vercel Serverless Functions (All-in-One)

Convert the backend to serverless functions:

1. **Create API route in frontend:**

   ```bash
   mkdir frontend/src/app/api/drive
   ```

2. **Move backend logic to serverless function:**

   - Copy the Google Drive logic to `frontend/src/app/api/drive/upload/route.ts`
   - Install dependencies: `npm install googleapis xlsx multer`

3. **Handle file upload in serverless:**
   - Use `formData` instead of multer
   - Process files directly in the API route

### Option 3: Docker Deployment

1. **Create Dockerfile for backend:**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   COPY service-account.json .
   EXPOSE 3001
   CMD ["npm", "start"]
   ```

2. **Deploy to any cloud provider** (AWS, Google Cloud, DigitalOcean)

## 🔧 Configuration Changes Needed

### 1. Environment Variables

**Frontend (.env.local):**

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**Backend (.env):**

```
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
PORT=3001
FRONTEND_URL=https://your-frontend-url.com
```

### 2. CORS Configuration

The backend now uses dynamic CORS:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
```

### 3. File Upload Changes

For serverless deployment, you'll need to modify the file handling since `multer` doesn't work the same way.

## 🌐 Free Hosting Options

| Service             | Frontend | Backend | Storage | Cost                     |
| ------------------- | -------- | ------- | ------- | ------------------------ |
| Vercel              | ✅       | ❌      | ❌      | Free tier available      |
| Netlify             | ✅       | ❌      | ❌      | Free tier available      |
| Railway             | ✅       | ✅      | ❌      | $5/month after free tier |
| Render              | ✅       | ✅      | ❌      | Free tier available      |
| Vercel + Serverless | ✅       | ✅      | ❌      | Free tier available      |

## 📋 Pre-Deployment Checklist

- [ ] Google Drive API is enabled
- [ ] Service account has folder access
- [ ] Environment variables are set
- [ ] `service-account.json` is uploaded to hosting
- [ ] CORS is configured correctly
- [ ] Test file upload works
- [ ] Excel tracking works

## 🔒 Security Considerations

1. **Service Account**: Keep `service-account.json` secure
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **File Validation**: Add file type validation if needed
4. **Domain Restrictions**: Limit CORS to your domain only

## 🚀 Quick Deploy (Vercel + Railway)

1. **Frontend to Vercel:**

   ```bash
   # Connect to Vercel
   npx vercel
   ```

2. **Backend to Railway:**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Deploy
   railway login
   railway init
   railway up
   ```

3. **Update environment variables** on both platforms

Your app will be publicly accessible at your Vercel URL!

## 🐛 Troubleshooting

**CORS Errors:**

- Ensure `FRONTEND_URL` matches your deployed frontend URL exactly
- Check that the backend URL in frontend env is correct

**Google Drive Errors:**

- Verify service account permissions
- Check that the folder ID is correct
- Ensure the service account JSON is properly uploaded

**Upload Failures:**

- Check file size limits (10MB)
- Verify backend is running and accessible
- Check browser console for errors
