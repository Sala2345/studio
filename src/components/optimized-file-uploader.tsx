

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UploadedFileData {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
  type: string;
}

interface FileObject {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url: string | null;
  fileName: string | null;
  error: string | null;
}

interface OptimizedFileUploaderProps {
  onFilesUploaded: (files: UploadedFileData[]) => void;
  maxFiles?: number;
}

const ExpressMulterUploader: React.FC<OptimizedFileUploaderProps> = ({ onFilesUploaded, maxFiles = 10 }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const updateFileState = useCallback((id: string, updates: Partial<FileObject>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const uploadWithProgress = (url: string, formData: FormData, onProgress: (progress: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new Error('Invalid JSON response from server.'));
          }
        } else {
          try {
             const errorResponse = JSON.parse(xhr.responseText);
             reject(new Error(errorResponse.error || `Server error: ${xhr.statusText}`));
          } catch {
             reject(new Error(`Upload failed with status ${xhr.status}.`));
          }
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was aborted.')));
      xhr.open('POST', url, true);
      xhr.send(formData);
    });
  };

  const uploadSingleFile = useCallback(async (fileObj: FileObject) => {
    updateFileState(fileObj.id, { status: 'uploading', progress: 0, error: null });
    try {
      const formData = new FormData();
      formData.append('file', fileObj.file);

      const response = await uploadWithProgress(`${API_URL}/api/upload`, formData, (progress) => {
        updateFileState(fileObj.id, { progress });
      });

      if (response.success) {
        updateFileState(fileObj.id, {
          status: 'done',
          progress: 100,
          url: response.file.url,
          fileName: response.file.fileName,
        });
      } else {
        throw new Error(response.error || 'Unknown upload error');
      }
    } catch (error) {
      updateFileState(fileObj.id, { status: 'error', error: (error as Error).message });
    }
  }, [API_URL, updateFileState]);

  const processFiles = useCallback(async (filesToProcess: FileObject[]) => {
    setIsProcessing(true);
    await Promise.all(filesToProcess.map(fileObj => uploadSingleFile(fileObj)));
    setIsProcessing(false);
  }, [uploadSingleFile]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setFiles(prevFiles => {
      if (prevFiles.length + selectedFiles.length > maxFiles) {
        toast({
          variant: 'destructive',
          title: `Cannot add files`,
          description: `You can only upload a maximum of ${maxFiles} files.`,
        });
        return prevFiles;
      }

      const newFiles: FileObject[] = Array.from(selectedFiles).map(file => ({
        file,
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'pending',
        url: null,
        fileName: null,
        error: null,
      }));

      const combinedFiles = [...prevFiles, ...newFiles];
      processFiles(newFiles);
      return combinedFiles;
    });
  }, [maxFiles, processFiles, toast]);
  
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    const fileObj = files.find(f => f.id === fileId);
    if (fileObj) {
        uploadSingleFile(fileObj);
    }
  };

  useEffect(() => {
    if (onFilesUploaded) {
        const uploadedFiles = files
            .filter(f => f.status === 'done' && f.url)
            .map(f => ({
                originalName: f.name,
                fileName: f.fileName!,
                url: f.url!,
                size: f.size,
                type: f.type,
            }));
        onFilesUploaded(uploadedFiles);
    }
  }, [files, onFilesUploaded]);
  
  const getStatusInfo = (status: FileObject['status']): { icon: React.ReactNode, text: string } => {
    switch (status) {
      case 'done': return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, text: 'Done' };
      case 'error': return { icon: <AlertCircle className="w-5 h-5 text-red-500" />, text: 'Error' };
      case 'uploading': return { icon: <Loader2 className="animate-spin w-5 h-5 text-blue-500" />, text: 'Uploading' };
      default: return { icon: <UploadCloud className="w-5 h-5 text-gray-400" />, text: 'Pending' };
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors bg-gray-50",
          isDragging ? "border-primary bg-primary/10 border-solid" : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        <input
          ref={fileInputRef} type="file" multiple className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".pdf,.png,.jpeg,.jpg,.ai,.psd,.tif,.cdr,.eps,.gif,.doc,.docx,.bpm,.webm,.m4a,.mp3"
          disabled={isProcessing}
        />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-4 text-gray-800">Click to browse, or drag and drop files here</p>
        <p className="mt-2 text-xs text-gray-500">Max {maxFiles} files. Images, audio, and documents accepted.</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Files:</h3>
          {files.map(file => {
            const statusInfo = getStatusInfo(file.status);
            return (
              <Card key={file.id} className="p-4 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {statusInfo.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>{formatSize(file.size)}</span>
                         {file.status === 'done' && file.url && (
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View File
                            </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {file.status === 'error' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => retryUpload(file.id)} aria-label="Retry upload">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                    {file.status !== 'uploading' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-destructive" onClick={() => removeFile(file.id)} aria-label="Remove file">
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                  </div>
                </div>
                 {file.status === 'uploading' && (
                    <div className="mt-2">
                        <Progress value={file.progress} className="h-1" />
                    </div>
                 )}
                 {file.status === 'error' && (
                    <p className="text-sm text-destructive mt-2">{file.error}</p>
                 )}
              </Card>
            );
          })}
        </div>
      )}
       {files.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {files.filter(f => f.status === 'done').length} of {files.length} files uploaded
            </span>
            {isProcessing && (
              <span className="text-primary flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                Processing...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { ExpressMulterUploader as OptimizedFileUploader };
