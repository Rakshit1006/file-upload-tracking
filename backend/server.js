const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
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

// Google Cloud Storage setup
const storage = new Storage({
  keyFilename: path.join(__dirname, "service-account.json"),
  projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// Excel file management
const EXCEL_FILE_NAME = "file-uploads-tracker.xlsx";

async function findOrCreateExcelFile() {
  try {
    // Search for existing Excel file
    const [files] = await bucket.getFiles({
      prefix: EXCEL_FILE_NAME,
    });

    if (files.length > 0) {
      return files[0].name;
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

    const file = bucket.file(EXCEL_FILE_NAME);
    await file.save(excelBuffer, {
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    return EXCEL_FILE_NAME;
  } catch (error) {
    console.error("Error finding/creating Excel file:", error);
    throw error;
  }
}

async function updateExcelFile(fileName, uploadedFileName, userName) {
  try {
    // Download existing Excel file
    const file = bucket.file(fileName);
    const [contents] = await file.download();

    const workbook = XLSX.read(contents, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert to JSON to append new row
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Add new entry
    const newEntry = {
      "File Name (ID)": uploadedFileName,
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

    await file.save(excelBuffer, {
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    return true;
  } catch (error) {
    console.error("Error updating Excel file:", error);
    throw error;
  }
}

// Multer configuration for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now, you can customize this
    cb(null, true);
  },
});

// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userName } = req.body;
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const uniqueFileName = req.file.filename;

    // Upload file to Google Cloud Storage
    const gcsFileName = `uploads/${uniqueFileName}`;
    const gcsFile = bucket.file(gcsFileName);

    await bucket.upload(filePath, {
      destination: gcsFileName,
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          originalName: originalName,
          uploadedBy: userName || "Anonymous",
          uploadDate: new Date().toISOString(),
        },
      },
    });

    // Make file public (optional)
    await gcsFile.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

    // Find or create Excel tracker file
    const excelFileName = await findOrCreateExcelFile();

    // Update Excel file with new entry
    await updateExcelFile(
      excelFileName,
      `${originalName} (${gcsFileName})`,
      userName || "Anonymous"
    );

    // Clean up local file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      fileName: originalName,
      gcsFileName: gcsFileName,
      publicUrl: publicUrl,
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
  console.log(`Using GCS bucket: ${bucketName}`);
});
