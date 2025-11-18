
'use client'; 
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { useCallback } from 'react';
import type { FileEntry } from '@uploadcare/react-uploader';

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
}

interface UploadcareWidgetProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

export function UploadcareWidget({ onFilesUploaded: handleFilesUploaded }: UploadcareWidgetProps) {

  const handleSuccess = useCallback((result: FileEntry[]) => {
    const uploadedFiles = result.map(entry => ({
      name: entry.fileInfo?.originalFilename || `file-${entry.uuid}`,
      url: entry.cdnUrl || '',
      size: entry.fileInfo?.size || 0,
      type: entry.fileInfo?.mimeType || '',
    }));
    handleFilesUploaded(uploadedFiles);
  }, [handleFilesUploaded]);

  return (
    <div>
      <FileUploaderRegular
         sourceList="local, camera, facebook, gdrive"
         classNameUploader="uc-light"
         pubkey="bfba8b2aa59367bc12a8"
         onFilesUpload={handleSuccess}
      />
    </div>
  );
}
