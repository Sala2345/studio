'use client';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { useCallback } from 'react';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

interface UploadcareWidgetProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

function UploadcareWidget({ onFilesUploaded }: UploadcareWidgetProps) {

  const handleUploadSuccess = useCallback((e: any) => {
    // The event detail contains all entries from the upload session
    const successfulFiles = e.detail.allEntries
      .filter((file: any) => file.status === "success")
      .map((entry: any) => ({
        url: entry.cdnUrl,
        name: entry.fileInfo?.originalFilename || `file-${entry.uuid}`,
        size: entry.fileInfo?.size || 0,
      }));

    if (successfulFiles.length > 0) {
      onFilesUploaded(successfulFiles);
    }
  }, [onFilesUploaded]);

  return (
    <div>
      <FileUploaderRegular
        sourceList="local, camera, facebook, gdrive"
        classNameUploader="uc-light"
        pubkey="bfba8b2aa59367bc12a8"
        onChange={handleUploadSuccess}
        multiple
      />
    </div>
  );
}

export default UploadcareWidget;
