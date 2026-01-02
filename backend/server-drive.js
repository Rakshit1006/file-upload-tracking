const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const XLSX = require("xlsx");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now, you can customize this
    cb(null, true);
  },
});

// Google Drive API setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "service-account.json"),
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

// Excel file management
const EXCEL_FILE_NAME = "file-uploads-tracker.xlsx";

async function findOrCreateExcelFile() {
  try {
    // Search for existing Excel file
    const fileList = await drive.files.list({
      q: `name='${EXCEL_FILE_NAME}' and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`,
      fields: "files(id, name)",
    });

    if (fileList.data.files.length > 0) {
      return fileList.data.files[0].id;
    }

    // Create new Excel file if not found
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      { "File Name (ID)": "", "User Name": "", Date: "" },
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Uploads");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    const createResponse = await drive.files.create({
      requestBody: {
        name: EXCEL_FILE_NAME,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      media: {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: require("stream").Readable.from(excelBuffer),
      },
    });

    return createResponse.data.id;
  } catch (error) {
    console.error("Error finding/creating Excel file:", error);
    throw error;
  }
}

async function updateExcelFile(fileId, fileName, userName) {
  try {
    // Download existing Excel file
    const downloadResponse = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" }
    );

    const workbook = XLSX.read(downloadResponse.data, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert to JSON to append new row
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Add new entry
    const newEntry = {
      "File Name (ID)": fileName,
      "User Name": userName,
      Date: new Date().toLocaleDateString(),
    };

    jsonData.push(newEntry);

    // Convert back to worksheet
    const newWorksheet = XLSX.utils.json_to_sheet(jsonData);
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    // Upload updated file
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: require("stream").Readable.from(excelBuffer),
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating Excel file:", error);
    throw error;
  }
}

// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userName } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Upload file to Google Drive
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // Optional: specify folder ID
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath),
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,name",
    });

    const uploadedFileId = driveResponse.data.id;

    // Find or create Excel tracker file
    const excelFileId = await findOrCreateExcelFile();

    // Update Excel file with new entry
    await updateExcelFile(
      excelFileId,
      `${fileName} (${uploadedFileId})`,
      userName || "Anonymous"
    );

    // Clean up local file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      fileId: uploadedFileId,
      fileName: fileName,
      message: "File uploaded and tracked successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);

    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Upload failed",
      message: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
