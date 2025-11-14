
"use client";

import React, { useState } from 'react';
import { UploadDropzone } from "@uploadthing/react";
import { X, CheckCircle } from 'lucide-react';
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  key: string;
}

interface SimpleFileUploaderProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export default function SimpleFileUploader({ 
  onFilesUploaded,
  maxFiles = 10 
}: SimpleFileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleUploadComplete = (res: any[]) => {
    console.log("✅ Files uploaded:", res);

    const newFiles: UploadedFile[] = res.map(file => ({
      name: file.name,
      url: file.url,
      size: file.size,
      key: file.key,
    }));

    const allFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(allFiles);
    onFilesUploaded(allFiles);

    toast({
        title: "Upload Complete!",
        description: `${newFiles.length} file(s) uploaded successfully.`,
    });
  };

  const removeFile = (key: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.key !== key);
    setUploadedFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-background">
        <UploadDropzone<OurFileRouter>
          endpoint="fileUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={(error: Error) => {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message,
            });
          }}
          config={{
            mode: "auto",
            maxFiles: maxFiles - uploadedFiles.length,
          }}
          appearance={{
            container: "w-full border-none p-0",
            uploadIcon: "text-primary",
            label: "text-primary text-lg",
            allowedContent: "text-muted-foreground text-sm",
          }}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Uploaded Files ({uploadedFiles.length}):
          </h3>

          {uploadedFiles.map((file) => (
            <div
              key={file.key}
              className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{formatSize(file.size)}</span>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View File
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeFile(file.key)}
                className="ml-2 p-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
