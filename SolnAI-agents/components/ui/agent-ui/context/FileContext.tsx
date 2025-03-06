import React, { createContext, ReactNode, useContext } from 'react';
import { FileUploadProgress, UploadedFile, useFileHandler } from '../hooks/useFileHandler';
import { useAgentContext } from './AgentContext';
import { useServices } from './ServiceContext';

interface FileContextType {
  uploads: Record<string, FileUploadProgress>;
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  error: string | null;
  uploadFile: (file: File, onProgress?: (progress: number) => void) => Promise<UploadedFile | null>;
  downloadFile: (fileId: string, fileName?: string) => Promise<boolean>;
  clearUpload: (fileId: string) => void;
  clearAllUploads: () => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

/**
 * Provider component for file uploads and downloads
 */
export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const { apiService } = useServices();
  const { currentAgent } = useAgentContext();

  // Use the file handler hook
  const {
    uploads,
    uploadedFiles,
    isUploading,
    error,
    uploadFile,
    downloadFile,
    clearUpload,
    clearAllUploads
  } = useFileHandler(apiService, currentAgent?.id);

  const value = {
    uploads,
    uploadedFiles,
    isUploading,
    error,
    uploadFile,
    downloadFile,
    clearUpload,
    clearAllUploads
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

/**
 * Hook to use the file context
 */
export const useFileContext = (): FileContextType => {
  const context = useContext(FileContext);

  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }

  return context;
};

export default FileContext;
