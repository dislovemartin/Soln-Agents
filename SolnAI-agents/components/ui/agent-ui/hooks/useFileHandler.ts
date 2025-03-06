import { useState, useCallback } from 'react';
import { ApiService } from '../services/api';

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

/**
 * Hook for handling file uploads and downloads
 */
export function useFileHandler(apiService: ApiService, agentId?: string) {
  const [uploads, setUploads] = useState<Record<string, FileUploadProgress>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Upload a file
  const uploadFile = useCallback(
    async (file: File, onProgress?: (progress: number) => void) => {
      if (!agentId) {
        setError('No agent selected');
        return null;
      }

      // Create a progress tracker
      const fileId = `${file.name}-${Date.now()}`;
      setUploads((prev) => ({
        ...prev,
        [fileId]: {
          fileName: file.name,
          progress: 0,
          status: 'pending'
        }
      }));

      setIsUploading(true);
      setError(null);

      try {
        // Update status to uploading
        setUploads((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: 'uploading'
          }
        }));

        // Custom progress handler
        const handleProgress = (progress: number) => {
          setUploads((prev) => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              progress
            }
          }));

          if (onProgress) {
            onProgress(progress);
          }
        };

        // Upload the file
        const response = await apiService.uploadFile(agentId, file, handleProgress);

        if (response.error) {
          setUploads((prev) => ({
            ...prev,
            [fileId]: {
              ...prev[fileId],
              status: 'error',
              error: response.error
            }
          }));
          setError(response.error);
          return null;
        }

        // Update status to success
        setUploads((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            progress: 100,
            status: 'success'
          }
        }));

        // Add to uploaded files
        if (response.data) {
          const uploadedFile: UploadedFile = response.data;
          setUploadedFiles((prev) => [...prev, uploadedFile]);
          return uploadedFile;
        }

        return null;
      } catch (err) {
        setUploads((prev) => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            status: 'error',
            error: err.message || 'Upload failed'
          }
        }));
        setError(err.message || 'Upload failed');
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [agentId, apiService]
  );

  // Download a file
  const downloadFile = useCallback(
    async (fileId: string, fileName?: string) => {
      if (!agentId) {
        setError('No agent selected');
        return false;
      }

      setError(null);

      try {
        const response = await apiService.downloadFile(agentId, fileId);

        if (response.error) {
          setError(response.error);
          return false;
        }

        if (response.data) {
          // Create a blob from the data
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);

          // Create a temporary link and click it
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName || fileId;
          document.body.appendChild(link);
          link.click();

          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);

          return true;
        }

        return false;
      } catch (err) {
        setError(err.message || 'Download failed');
        return false;
      }
    },
    [agentId, apiService]
  );

  // Clear upload progress
  const clearUpload = useCallback((fileId: string) => {
    setUploads((prev) => {
      const newUploads = { ...prev };
      delete newUploads[fileId];
      return newUploads;
    });
  }, []);

  // Clear all uploads
  const clearAllUploads = useCallback(() => {
    setUploads({});
  }, []);

  return {
    uploads,
    uploadedFiles,
    isUploading,
    error,
    uploadFile,
    downloadFile,
    clearUpload,
    clearAllUploads
  };
}

export default useFileHandler;
