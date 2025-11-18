'use client';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { useCallback } from 'react';

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
}

interface UploadcareWidgetProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

export function UploadcareWidget({ onFilesUploaded }: UploadcareWidgetProps) {

  const handleSuccess = useCallback((e: any) => {
    if (e.detail?.successEntries) {
        const uploadedFiles = e.detail.successEntries.map((entry: any) => ({
            name: entry.fileInfo?.originalFilename || `file-${entry.uuid}`,
            url: entry.cdnUrl || '',
            size: entry.fileInfo?.size || 0,
            type: entry.fileInfo?.mimeType || '',
        }));
        onFilesUploaded(uploadedFiles);
    }
  }, [onFilesUploaded]);

  return (
    <div>
      <FileUploaderRegular
         sourceList="local, camera, facebook, gdrive"
         classNameUploader="uc-light"
         pubkey="bfba8b2aa59367bc12a8"
         multiple
         onCommonUploadSuccess={handleSuccess}
      />
    </div>
  );
}
