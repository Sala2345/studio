
// File: components/FileUploadSection.tsx
import React, { useState } from 'react';
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { X, File, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  key: string;
}

interface FileUploadSectionProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploadedFiles,
  onFilesChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const handleRemoveFile = (fileKey: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.key !== fileKey);
    onFilesChange(updatedFiles);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition">
        <UploadDropzone<OurFileRouter>
          endpoint="designFileUploader"
          onClientUploadComplete={(res) => {
            if (res) {
              const newFiles: UploadedFile[] = res.map(file => ({
                name: file.name,
                url: file.url,
                size: file.size,
                type: file.type || 'application/octet-stream', // Fallback type
                key: file.key,
              }));
              onFilesChange([...uploadedFiles, ...newFiles]);
              setIsUploading(false);
              console.log('Files uploaded successfully:', newFiles);
            }
          }}
          onUploadError={(error: Error) => {
            alert(`Upload error: ${error.message}`);
            setIsUploading(false);
          }}
          onUploadBegin={() => {
            setIsUploading(true);
          }}
          appearance={{
            container: "border-none p-0",
            uploadIcon: "text-gray-400",
            label: "text-gray-600 text-sm",
            allowedContent: "text-gray-500 text-xs",
          }}
        />
      </div>

      {/* Display uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.key}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.key)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Uploading files...</span>
          </div>
        </div>
      )}
    </div>
  );
};
