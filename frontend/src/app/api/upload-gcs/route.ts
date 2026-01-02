import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import * as XLSX from "xlsx";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME!;
const bucket = storage.bucket(bucketName);

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

    const tempPath = join(tmpdir(), EXCEL_FILE_NAME);
    await writeFile(tempPath, excelBuffer);

    await bucket.upload(tempPath, {
      destination: EXCEL_FILE_NAME,
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    await unlink(tempPath);
    return EXCEL_FILE_NAME;
  } catch (error) {
    console.error("Error finding/creating Excel file:", error);
    throw error;
  }
}

async function updateExcelFile(
  fileName: string,
  uploadedFileName: string,
  userName: string
) {
  try {
    // Download existing Excel file
    const tempPath = join(tmpdir(), `temp-${fileName}`);
    const file = bucket.file(fileName);

    await file.download({ destination: tempPath });

    const workbook = XLSX.readFile(tempPath);
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

    await writeFile(tempPath, excelBuffer);

    await bucket.upload(tempPath, {
      destination: fileName,
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    await unlink(tempPath);
    return true;
  } catch (error) {
    console.error("Error updating Excel file:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userName = formData.get("userName") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = join(tmpdir(), file.name);
    await writeFile(tempPath, buffer);

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const gcsFileName = `uploads/${uniqueSuffix}-${file.name}`;

    // Upload to Google Cloud Storage
    await bucket.upload(tempPath, {
      destination: gcsFileName,
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: userName || "Anonymous",
          uploadDate: new Date().toISOString(),
        },
      },
    });

    // Make file public
    const gcsFile = bucket.file(gcsFileName);
    await gcsFile.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;

    // Update Excel tracker
    const excelFileName = await findOrCreateExcelFile();
    await updateExcelFile(
      excelFileName,
      `${file.name} (${gcsFileName})`,
      userName || "Anonymous"
    );

    // Clean up temp file
    await unlink(tempPath);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      gcsFileName,
      publicUrl,
      message: "File uploaded and tracked successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
