# Free Hosting Guide

Complete guide to host your file upload application for free.

## 🏆 **Recommended: Vercel Serverless (100% Free)**

This is the best option because:

- ✅ **Completely free** - no separate backend hosting
- ✅ **One deployment** - frontend + backend together
- ✅ **Built for Next.js** - perfect fit
- ✅ **Global CDN** - fast worldwide
- ✅ **Automatic HTTPS** - secure by default

## 🚀 **Setup Steps**

### 1. Prepare Your Code

✅ **Already done:**

- Created serverless API route: `/api/upload-gcs`
- Updated frontend to use new route
- Added required dependencies

### 2. Environment Variables

Create `frontend/.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GCLOUD_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
```

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. **Push to GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repo
   - Add environment variables in Vercel dashboard
   - Deploy!

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, add environment variables
```

### 4. Upload Service Account

**Method 1: Vercel Environment Variables**

- Go to your Vercel project
- Settings → Environment Variables
- Add `GOOGLE_APPLICATION_CREDENTIALS` with the JSON content

**Method 2: File Upload (Easier)**

- Upload `service-account.json` to your repo
- Set environment variable to point to it

## 🌐 **Alternative Free Options**

### Option 2: Vercel + Railway

- **Vercel**: Frontend (free)
- **Railway**: Backend ($5 credit/month)
- Use your existing `server-gcs.js`

### Option 3: Netlify + Render

- **Netlify**: Frontend (free)
- **Render**: Backend (free tier)
- Similar setup to Vercel + Railway

### Option 4: Firebase Hosting + Functions

- **Firebase Hosting**: Frontend (free)
- **Firebase Functions**: Backend (free tier)
- Google ecosystem integration

## 📊 **Free Tier Limits**

### Vercel (Serverless)

- ✅ **100GB bandwidth** per month
- ✅ **Unlimited deployments**
- ✅ **Custom domains**
- ✅ **Serverless functions**: 100k invocations/month

### Google Cloud Storage

- ✅ **5GB storage**
- ✅ **1GB/day downloads**
- ✅ **Enough for thousands of files**

## 🔧 **Production Optimizations**

### 1. File Size Limits

```javascript
// Already implemented: 10MB limit
if (file.size > 10 * 1024 * 1024) {
  return NextResponse.json({ error: "File size exceeds 10MB limit" });
}
```

### 2. Error Handling

```javascript
// Already implemented: Comprehensive error handling
try {
  // Upload logic
} catch (error) {
  return NextResponse.json({ error: "Upload failed", message: error.message });
}
```

### 3. Security

- ✅ File type validation
- ✅ Size limits
- ✅ Secure GCS bucket permissions

## 🚀 **Deployment Checklist**

- [ ] Push code to GitHub
- [ ] Create Vercel account
- [ ] Import repository to Vercel
- [ ] Add environment variables:
  - `GOOGLE_APPLICATION_CREDENTIALS`
  - `GCLOUD_PROJECT_ID`
  - `GCS_BUCKET_NAME`
- [ ] Deploy successfully
- [ ] Test file upload
- [ ] Verify files appear in GCS bucket
- [ ] Check Excel tracking works

## 🌍 **Custom Domain (Optional)**

1. **Buy domain** (or use free one)
2. **Add to Vercel**: Project → Settings → Domains
3. **Update DNS**: Follow Vercel instructions
4. **SSL**: Automatic (free)

## 📈 **Monitoring**

### Vercel Dashboard

- View function logs
- Monitor usage
- Check error rates

### Google Cloud Console

- Storage usage
- API calls
- Billing alerts

## 🐛 **Troubleshooting**

### Common Issues

**"Function not found"**

- Check file path: `frontend/src/app/api/upload-gcs/route.ts`
- Ensure proper export: `export async function POST`

**"Permission denied"**

- Verify service account permissions
- Check GCS bucket access
- Ensure environment variables are set

**"File too large"**

- 10MB limit is enforced
- Consider increasing if needed

**"Module not found"**

- Run `npm install` in frontend directory
- Check `package.json` dependencies

## 🎯 **Next Steps**

1. **Deploy to Vercel** using the guide above
2. **Test thoroughly** with different file types
3. **Monitor usage** in Vercel dashboard
4. **Scale when needed** (upgrade plans available)

## 💡 **Pro Tips**

- **Use GitHub** for automatic deployments
- **Set up alerts** for usage limits
- **Backup service account** key securely
- **Test with small files** first
- **Monitor GCS costs** if you grow

## 🎉 **You're Ready!**

Your application is now ready for free public hosting. The serverless approach means:

- No server management
- Automatic scaling
- Global CDN
- Zero maintenance

Deploy to Vercel and your app will be live in minutes! 🚀
