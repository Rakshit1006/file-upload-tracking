# Google Cloud Storage Setup Guide

This guide shows how to switch from Google Drive to Google Cloud Storage.

## 🚀 Why Switch to GCS?

- **Better Performance**: Faster uploads and downloads
- **More Reliable**: Designed for applications, not manual file sharing
- **Better API**: More robust and developer-friendly
- **Scalable**: Handles large volumes better
- **Cost Effective**: More predictable pricing
- **Security**: Better access control with IAM

## 📋 Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID** (needed for configuration)

### 2. Enable Cloud Storage API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Cloud Storage API"
3. Click "Enable"

### 3. Create a Storage Bucket

1. Go to "Cloud Storage" → "Buckets"
2. Click "Create Bucket"
3. Configure bucket:
   - **Name**: Unique globally (e.g., `my-app-file-uploads-2024`)
   - **Location**: Choose nearest region
   - **Storage class**: Standard (for frequently accessed files)
   - **Control access**: Uniform (recommended)
   - **Protection**: Keep defaults or enable as needed

### 4. Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Fill in details:
   - Name: `file-upload-service`
   - Description: `Service account for file uploads`
4. Click "Create and Continue"
5. Add role: **Storage Object Admin** (allows full access to bucket)
6. Click "Continue" → "Done"

### 5. Generate Service Account Key

1. Click on the service account you created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select **JSON** format
5. Click "Create"
6. Save the downloaded JSON file as `service-account.json` in your backend directory

### 6. Update Configuration

1. Copy the new environment file:

   ```bash
   cd backend
   cp .env.gcs.example .env
   ```

2. Update `.env` with your values:
   ```
   GCS_BUCKET_NAME=your-actual-bucket-name
   GCLOUD_PROJECT_ID=your-project-id
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

### 7. Switch to GCS Server

1. Update your `package.json` scripts:

   ```json
   {
     "scripts": {
       "start": "node server-gcs.js",
       "dev": "nodemon server-gcs.js"
     }
   }
   ```

2. Or rename the file:
   ```bash
   cd backend
   mv server.js server-drive.js
   mv server-gcs.js server.js
   ```

## 🔧 Configuration Differences

### Google Drive vs GCS

| Feature        | Google Drive          | Google Cloud Storage    |
| -------------- | --------------------- | ----------------------- |
| API            | Drive API             | Storage API             |
| Authentication | OAuth/Service Account | Service Account         |
| File Structure | Folders/Files         | Buckets/Objects         |
| Public URLs    | Complex               | Simple `gs://` or HTTPS |
| Metadata       | Limited               | Rich custom metadata    |
| Excel Tracking | Separate file         | Same (but faster)       |

### Environment Variables

**Google Drive:**

```
GOOGLE_DRIVE_FOLDER_ID=1iFMcQTO7vYw-HVp0fFW4aHUlGCWnQRyn
```

**Google Cloud Storage:**

```
GCS_BUCKET_NAME=my-app-file-uploads-2024
GCLOUD_PROJECT_ID=my-project-12345
```

## 🚀 Benefits You'll Get

### 1. Better File URLs

```javascript
// GCS (clean and direct)
const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

// Drive (complex API calls)
const fileId = await drive.files.create({...});
```

### 2. Rich Metadata

```javascript
const metadata = {
  contentType: "image/jpeg",
  metadata: {
    originalName: "photo.jpg",
    uploadedBy: "John Doe",
    uploadDate: "2024-01-01T12:00:00Z",
    customField: "any value you want",
  },
};
```

### 3. Better Error Handling

- More specific error messages
- Better retry logic
- More reliable uploads

## 📊 Cost Comparison

**Google Drive:**

- Free: 15GB storage
- Paid: $1.99/month for 100GB

**Google Cloud Storage:**

- Free tier: 5GB storage, 1GB/day egress
- Standard: $0.020 per GB/month
- Egress: $0.12 per GB (first 1GB/day free)

For most applications, GCS is more cost-effective at scale.

## 🔄 Migration Steps

If you have existing files in Google Drive:

1. **Export current data** from Drive Excel file
2. **Upload files** to GCS bucket
3. **Update Excel file** with new GCS file names
4. **Switch backend** to use GCS
5. **Test thoroughly**

## 🧪 Testing GCS Setup

1. **Start the server:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Test upload** through the frontend

3. **Check GCS Console:**

   - Go to your bucket
   - Verify files appear in `uploads/` folder
   - Check Excel file is updated

4. **Test public URLs** by clicking the file links

## 🔒 Security Best Practices

1. **IAM Roles**: Use least privileged access
2. **Bucket Permissions**: Keep private unless public access needed
3. **Service Account**: Rotate keys regularly
4. **Network Security**: Use VPC if possible

## 🚀 Production Considerations

1. **Bucket Location**: Choose region closest to users
2. **Storage Class**: Use Standard for active files
3. **Lifecycle Rules**: Auto-delete old files if needed
4. **Monitoring**: Set up GCS monitoring and alerts

## 🐛 Troubleshooting

**Common Issues:**

1. **"Access Denied"**

   - Check service account permissions
   - Verify bucket exists
   - Ensure project ID is correct

2. **"Bucket Not Found"**

   - Verify bucket name spelling
   - Check you're in the right project

3. **"Permission Denied"**

   - Service account needs "Storage Object Admin" role
   - Check IAM permissions

4. **Upload Failures**
   - Check file size limits
   - Verify network connectivity
   - Check CORS settings

## ✅ Switch Checklist

- [ ] GCS bucket created
- [ ] Service account created with proper permissions
- [ ] Service account key downloaded
- [ ] Environment variables updated
- [ ] Backend switched to `server-gcs.js`
- [ ] Frontend tested with new backend
- [ ] Files appear in GCS bucket
- [ ] Excel tracking works
- [ ] Public URLs accessible

You're now ready to use Google Cloud Storage! 🎉
