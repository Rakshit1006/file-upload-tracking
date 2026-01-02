"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  fileName?: string;
  progress?: number;
}

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const [userName, setUserName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const maxRetries = 3;
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return "File size exceeds 10MB limit";
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({ status: "error", message: validationError });
      return;
    }

    setSelectedFile(file);
    setUploadState({ status: "idle", message: "" });
    setRetryCount(0);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadFile = async (
    file: File,
    user: string,
    attempt: number = 1
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userName", user || "Anonymous");

    try {
      setUploadState({
        status: "uploading",
        message: `Uploading file...${
          attempt > 1 ? ` (Attempt ${attempt}/${maxRetries})` : ""
        }`,
        fileName: file.name,
        progress: 0,
      });

      const response = await fetch("/api/upload-gcs", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();

      setUploadState({
        status: "success",
        message: "File uploaded successfully!",
        fileName: file.name,
        progress: 100,
      });

      onUploadSuccess?.(result);
      setRetryCount(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (attempt < maxRetries) {
        setRetryCount(attempt);
        setUploadState({
          status: "error",
          message: `Upload failed. Retrying in 2 seconds... (${attempt}/${maxRetries})`,
          fileName: file.name,
        });

        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return uploadFile(file, user, attempt + 1);
      } else {
        setUploadState({
          status: "error",
          message: `Upload failed after ${maxRetries} attempts: ${errorMessage}`,
          fileName: file.name,
        });
        onUploadError?.(errorMessage);
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setUploadState({
        status: "error",
        message: "Please select a file first",
      });
      return;
    }

    if (!userName.trim()) {
      setUploadState({ status: "error", message: "Please enter your name" });
      return;
    }

    uploadFile(selectedFile, userName.trim());
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUserName("");
    setUploadState({ status: "idle", message: "" });
    setRetryCount(0);
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case "uploading":
        return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        File Upload to Google Drive
      </h2>

      {/* User Name Input */}
      <div className="mb-6">
        <label
          htmlFor="userName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Name *
        </label>
        <input
          type="text"
          id="userName"
          required={true}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={uploadState.status === "uploading"}
        />
      </div>

      {/* File Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : uploadState.status === "error"
            ? "border-red-300 bg-red-50"
            : uploadState.status === "success"
            ? "border-green-300 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploadState.status === "uploading"}
        />

        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}

          <div>
            <p className="text-lg font-medium text-gray-700">
              {selectedFile
                ? selectedFile.name
                : "Drop your file here or click to browse"}
            </p>
            {selectedFile && (
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          {!selectedFile && (
            <p className="text-sm text-gray-500">
              Supported file types: All files (Max 10MB)
            </p>
          )}
        </div>
      </div>

      {/* Status Message */}
      {uploadState.message && (
        <div
          className={`mt-4 p-3 rounded-md ${
            uploadState.status === "success"
              ? "bg-green-100 text-green-800"
              : uploadState.status === "error"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm">{uploadState.message}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleUpload}
          disabled={
            !selectedFile ||
            !userName.trim() ||
            uploadState.status === "uploading"
          }
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploadState.status === "uploading"
            ? "Uploading..."
            : "Upload to Drive"}
        </button>

        {(uploadState.status === "success" ||
          uploadState.status === "error") && (
          <button
            onClick={resetForm}
            className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Upload Another File
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter your name (required)</li>
          <li>• Select a file by dragging & dropping or clicking</li>
          <li>• Maximum file size: 10MB</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
