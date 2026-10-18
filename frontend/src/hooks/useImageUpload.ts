import { useState, useCallback } from 'react';
import { uploadImage, validateImageFile } from '../services/uploadService';

interface UseImageUploadReturn {
  uploadedImageUrl: string | null;
  isUploading: boolean;
  error: string | null;
  handleImageUpload: (file: File) => Promise<void>;
  handleImageRemove: () => void;
  resetUpload: () => void;
}

/**
 * Custom hook for handling image upload functionality
 * @param initialImageUrl - Initial image URL if editing existing item
 * @returns Object with upload state and handlers
 */
export const useImageUpload = (initialImageUrl?: string): UseImageUploadReturn => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Upload image
      const response = await uploadImage(file);
      
      if (response.success && response.data) {
        setUploadedImageUrl(response.data.url);
        setError(null);
      } else {
        setError(response.error || response.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleImageRemove = useCallback(() => {
    setUploadedImageUrl(null);
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    setUploadedImageUrl(initialImageUrl || null);
    setIsUploading(false);
    setError(null);
  }, [initialImageUrl]);

  return {
    uploadedImageUrl,
    isUploading,
    error,
    handleImageUpload,
    handleImageRemove,
    resetUpload
  };
};