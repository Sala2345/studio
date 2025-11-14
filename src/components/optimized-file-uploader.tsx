
'use client';

import React, { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UploadedFileData {
  name: string;
  url: string;
  type: string;
  originalSize: number;
  compressedSize?: number;
}

interface FileObject {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'done' | 'error';
  url: string | null;
  error: string | null;
  compressedSize?: number;
}

interface OptimizedFileUploaderProps {
  onFilesUploaded: (files: UploadedFileData[]) => void;
  maxFiles?: number;
}

const OptimizedFileUploader: React.FC<OptimizedFileUploaderProps> = ({ onFilesUploaded, maxFiles = 10 }) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateFileStatus = (fileId: string, updates: Partial<FileObject>) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      )
    );
  };

  const notifyParent = (currentFiles: FileObject[]) => {
    if (onFilesUploaded) {
      const uploadedFiles = currentFiles
        .filter(f => f.status === 'done' && f.url)
        .map(f => ({
          name: f.name,
          url: f.url!,
          type: f.type,
          originalSize: f.size,
          compressedSize: f.compressedSize,
        }));
      onFilesUploaded(uploadedFiles);
    }
  };

  const processFiles = useCallback(async (filesToProcess: FileObject[]) => {
    setIsProcessing(true);

    const processPromises = filesToProcess.map(async (fileObj) => {
      try {
        // Step 1: Compress
        updateFileStatus(fileObj.id, { status: 'compressing', progress: 0 });
        const compressedFile = await compressFile(fileObj.file);

        // Step 2: Upload
        updateFileStatus(fileObj.id, { status: 'uploading', progress: 0 });
        const url = await uploadFile(compressedFile, (progress) => {
          updateFileStatus(fileObj.id, { progress });
        });

        // Step 3: Done
        const finalUpdates: Partial<FileObject> = {
          status: 'done',
          progress: 100,
          url,
          compressedSize: compressedFile.size,
        };
        updateFileStatus(fileObj.id, finalUpdates);

      } catch (error) {
        console.error('Upload error:', error);
        updateFileStatus(fileObj.id, {
          status: 'error',
          error: (error as Error).message,
        });
      }
    });

    await Promise.all(processPromises);
    setIsProcessing(false);
    
    setFiles(currentFiles => {
        notifyParent(currentFiles);
        return currentFiles;
    })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
          variant: 'destructive',
          title: `Cannot add files`,
          description: `You can only upload a maximum of ${maxFiles} files.`
      });
      return;
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
      error: null,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    processFiles(newFiles);
  }, [files.length, maxFiles, processFiles, toast]);


  const compressFile = async (file: File): Promise<File> => {
    if (file.type.startsWith('image/') && file.size > 500 * 1024) { // Compress images > 500KB
      try {
        const options = {
          maxSizeMB: 5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
         toast({
            title: `Image compressed: ${compressedFile.name}`,
            description: `Original size: ${formatSize(file.size)}, New size: ${formatSize(compressedFile.size)}`,
        });
        return compressedFile;
      } catch(e) {
        console.warn(`Could not compress ${file.name}, uploading original.`, e);
        return file;
      }
    }
    return file;
  };

  const uploadFile = (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `design_requests/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch(error) {
             reject(error);
          }
        }
      );
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
        const newFiles = prev.filter(f => f.id !== fileId);
        notifyParent(newFiles);
        return newFiles;
    });
  };

  const getStatusInfo = (status: FileObject['status']): { color: string, text: string } => {
    switch (status) {
      case 'done': return { color: 'bg-green-100 text-green-800', text: 'Done' };
      case 'error': return { color: 'bg-red-100 text-red-800', text: 'Error' };
      case 'uploading': return { color: 'bg-blue-100 text-blue-800', text: 'Uploading' };
      case 'compressing': return { color: 'bg-yellow-100 text-yellow-800', text: 'Compressing' };
      default: return { color: 'bg-gray-100 text-gray-800', text: 'Pending' };
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept=".pdf,.png,.jpeg,.jpg,.ai,.psd,.tif,.cdr,.eps,.gif,.doc,.docx,.bpm,.webm,.m4a,.mp3"
          disabled={isProcessing}
        />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
        <p className="mt-4 text-gray-800">Click to browse, or drag and drop files here</p>
        <p className="mt-2 text-xs text-gray-500">
          Max {maxFiles} files. Images, audio, and documents accepted.
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Files:</h3>
          {files.map(file => {
            const statusInfo = getStatusInfo(file.status);
            return (
              <Card key={file.id} className="p-4 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatSize(file.size)}
                      {file.compressedSize && file.compressedSize !== file.size && (
                        <span className="text-green-600 ml-2">
                          → {formatSize(file.compressedSize)}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 text-gray-500 hover:text-destructive"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {(file.status === 'uploading' || file.status === 'compressing') && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}
                
                {file.status === 'error' && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4"/> {file.error || 'Upload failed'}
                  </p>
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
              <span className="text-blue-600 flex items-center gap-2">
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

export { OptimizedFileUploader };
