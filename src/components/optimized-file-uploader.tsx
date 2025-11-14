
'use client';

import React from 'react';
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
import { useToast } from '@/hooks/use-toast';
import type { UploadFileResponse } from 'uploadthing/client';

export interface UploadedFileData {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
}

interface OptimizedFileUploaderProps {
  onFilesUploaded: (files: UploadedFileData[]) => void;
  maxFiles?: number;
}


export const OptimizedFileUploader: React.FC<OptimizedFileUploaderProps> = ({ onFilesUploaded }) => {
    const { toast } = useToast();
    
    return (
        <UploadDropzone<OurFileRouter>
            endpoint="fileUploader"
            onClientUploadComplete={(res?: UploadFileResponse[]) => {
                if (res) {
                    const uploadedFiles = res.map(file => ({
                        originalName: file.name,
                        fileName: file.key, 
                        url: file.url,
                        size: file.size,
                        type: "", // Uploadthing doesn't provide type in the response
                    }));
                    onFilesUploaded(uploadedFiles);
                    toast({
                        title: "Upload Complete!",
                        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
                    });
                }
            }}
            onUploadError={(error: Error) => {
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: error.message,
                });
            }}
            config={{
                mode: "auto",
            }}
        />
    );
};
