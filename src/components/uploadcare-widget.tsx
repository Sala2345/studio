'use client';
import { useState } from 'react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface UploadcareWidgetProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

function UploadcareWidget({ onFilesUploaded }: UploadcareWidgetProps) {
  const handleUpload = (e: any) => {
    const uploadedFiles = e.detail.successEntries.map((file: any) => ({
      name: file.fileInfo.originalFilename,
      url: file.cdnUrl,
      size: file.fileInfo.size,
      type: file.fileInfo.mimeType,
    }));
    onFilesUploaded(uploadedFiles);
    const fileUrl = e.detail?.successEntries?.[0]?.cdnUrl;
    console.log("Extracted URL:", fileUrl);
  };

  return (
    <div>
      <FileUploaderRegular
        sourceList="local, camera, facebook, gdrive"
        classNameUploader="uc-light"
        pubkey="bfba8b2aa59367bc12a8"
        onCommonUploadSuccess={handleUpload}
        multiple
      />
    </div>
  );
}

export default UploadcareWidget;
