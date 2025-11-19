'use client'
import React from 'react';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';

interface UploadcareWidgetProps {
  onFilesUploaded: (files: { name: string; url: string; size: number; type: string }[]) => void;
}

export default function UploadcareWidget({ onFilesUploaded }: UploadcareWidgetProps) {
  const handleChangeEvent = (e: any) => {
    try {
      console.log("Full event:", e);
      console.log("Event keys:", Object.keys(e));
      console.log("Event detail:", e.detail);
      
      // Try different possible structures
      const successfulFiles = e.detail?.allEntries?.filter((file: any) => file.status === "success") 
        || e.detail?.successEntries 
        || e.allEntries?.filter((file: any) => file.status === "success")
        || [];
      
      console.log("Successful files:", successfulFiles);
      
      if (successfulFiles.length === 0) {
        console.log("No successful files found");
        return;
      }

      const formattedFiles = successfulFiles.map((entry: any) => ({
        name: entry.name || 'Unnamed file',
        url: entry.cdnUrl,
        size: entry.size || 0,
        type: entry.mimeType || 'unknown'
      }));

      console.log("Formatted files:", formattedFiles);
      onFilesUploaded(formattedFiles);
    } catch (error) {
      console.error("Error processing uploads:", error);
    }
  };

  return (
    <FileUploaderRegular
      sourceList="local, camera, facebook, gdrive"
      classNameUploader="uc-light"
      pubkey=""
      onChange={handleChangeEvent}
    />
  );
}
