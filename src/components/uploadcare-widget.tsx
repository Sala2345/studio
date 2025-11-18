'use client'
import { useState, useCallback } from 'react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';

interface UploadedFile {
    name: string;
    url: string;
    size: number;
    type: string;
}

interface UploadcareWidgetProps {
    onFilesUploaded: (files: Omit<UploadedFile, 'key'>[]) => void;
}

function UploadcareWidget({ onFilesUploaded }: UploadcareWidgetProps) {
    const handleUploadSuccess = useCallback((e: any) => {
        const fileUrl = e.detail?.successEntries?.[0]?.cdnUrl;
        console.log("Extracted URL:", fileUrl);
        // Assuming we want to handle file info. The current code from the user doesn't do this.
        // For now, let's just make it work as per the user's snippet.
        // Let's adapt it slightly to make it useful for the form.
        const files = e.detail.successEntries.map((entry: any) => ({
            url: entry.cdnUrl,
            name: entry.fileInfo.originalFilename || `file-${entry.uuid}`,
            size: entry.fileInfo.size,
            type: entry.fileInfo.mimeType,
        }));
        if (files.length > 0) {
            onFilesUploaded(files);
        }

    }, [onFilesUploaded]);


    return (
        <div>
            <FileUploaderRegular
                sourceList="local, camera, facebook, gdrive"
                classNameUploader="uc-light"
                pubkey="bfba8b2aa59367bc12a8"
                onCommonUploadSuccess={handleUploadSuccess}
                multiple
            />
        </div>
    );
}
export default UploadcareWidget;
