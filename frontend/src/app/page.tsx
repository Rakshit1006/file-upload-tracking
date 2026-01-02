"use client";

import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Please upload your files here
          </h1>
          <p className="text-lg text-gray-600">
            Contact us at +91 9582693059 for any queries
          </p>
        </div>

        <FileUpload
          onUploadSuccess={(data) => {
            console.log("Upload successful:", data);
          }}
          onUploadError={(error) => {
            console.error("Upload failed:", error);
          }}
        />
      </div>
    </div>
  );
}
