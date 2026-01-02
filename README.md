# File Upload to Google Drive

A Next.js frontend and Node.js backend application for uploading files to Google Drive with automatic Excel tracking.

## Features

- **File Upload**: Drag & drop or click to browse files
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Retry Logic**: Automatic retry on upload failures (max 3 attempts)
- **Google Drive Integration**: Files are uploaded directly to Google Drive
- **Excel Tracking**: Automatically creates and updates an Excel file with upload details
- **User Information**: Tracks file name (with ID), user name, and upload date

## Project Structure

```
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/      # App router pages and API routes
│   │   └── components/ # React components
│   └── package.json
├── backend/           # Node.js Express server
│   ├── server.js     # Main server file
│   ├── uploads/      # Temporary file storage
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create a service account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and description
   - Click "Create and Continue"
   - Skip granting roles (or grant appropriate roles)
   - Click "Done"
5. Create a JSON key:
   - Click on the service account you created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" and click "Create"
   - Save the downloaded JSON file as `service-account.json` in the `backend/` directory
6. Share a Google Drive folder with the service account:
   - Create a folder in Google Drive where you want files to be uploaded
   - Share the folder with the service account email (found in the JSON file)
   - Give it "Editor" permissions
   - Copy the folder ID from the URL (the part after `/folder/`)

### 2. Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env
   ```

4. Update `.env` file with your configuration:

   ```
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
   PORT=3001
   ```

5. Place your `service-account.json` file in the backend directory

### 3. Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file (optional):
   ```bash
   # Create .env.local in frontend directory
   BACKEND_URL=http://localhost:3001
   ```

## Running the Application

### Method 1: Run Both Services Separately

1. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend (in another terminal):

   ```bash
   cd frontend
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Method 2: Using Root Scripts

From the root directory:

1. Install all dependencies:

   ```bash
   npm run install:all
   ```

2. Run both services (requires two terminals):

   ```bash
   # Terminal 1
   npm run dev:backend

   # Terminal 2
   npm run dev:frontend
   ```

## Usage

1. Open the application in your browser
2. Enter your name in the provided field
3. Drag and drop a file or click to browse
4. Click "Upload to Drive"
5. The file will be uploaded to Google Drive
6. An Excel file named `file-uploads-tracker.xlsx` will be automatically created/updated in your Google Drive with:
   - File name with Google Drive ID
   - User name
   - Upload date

## Features Details

### Error Handling & Retry

- Automatic retry on network failures (max 3 attempts)
- 2-second delay between retry attempts
- Clear error messages for different failure scenarios
- File size validation (10MB limit)
- User-friendly status indicators

### Excel Tracking

- Creates `file-uploads-tracker.xlsx` if it doesn't exist
- Updates existing file with new upload entries
- Tracks: File Name (with Drive ID), User Name, Date
- Stored in the same Google Drive folder as uploaded files

### File Upload

- Supports all file types
- 10MB file size limit
- Drag & drop interface
- Progress indicators
- Real-time status updates

## Environment Variables

### Backend (.env)

```
GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
PORT=3001
```

### Frontend (.env.local - optional)

```
BACKEND_URL=http://localhost:3001
```

## Dependencies

### Backend

- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling
- `googleapis` - Google Drive API client
- `xlsx` - Excel file manipulation
- `dotenv` - Environment variable management

### Frontend

- `next` - React framework
- `react` - UI library
- `lucide-react` - Icon library
- `tailwindcss` - CSS framework

## Troubleshooting

### Common Issues

1. **Google Drive API Errors**

   - Ensure service account has proper permissions
   - Check that the folder is shared with the service account
   - Verify the service account JSON file is correctly placed

2. **Upload Failures**

   - Check file size (max 10MB)
   - Ensure backend server is running
   - Verify environment variables are set correctly

3. **Excel File Issues**
   - Ensure service account has write permissions to the folder
   - Check if the Excel file already exists and is accessible

### Logs

- Backend logs are shown in the terminal where the server is running
- Frontend logs are available in the browser console
- Check browser console for API errors

## Development

### Adding New Features

1. Backend routes are in `backend/server.js`
2. Frontend components are in `frontend/src/components/`
3. API routes are in `frontend/src/app/api/`

### Testing

- Test with different file types and sizes
- Verify error handling with network failures
- Check Excel file updates in Google Drive

## License

MIT License
