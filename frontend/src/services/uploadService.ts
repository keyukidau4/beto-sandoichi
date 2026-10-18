import axios from 'axios';

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
  };
  error?: string;
}

/**
 * Upload image to Cloudinary via backend API
 * @param file - Image file to upload
 * @returns Promise with upload response
 */
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  try {
    // Validate file on client side
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 3 * 1024 * 1024; // 3MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, JPG, PNG, and GIF files are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 3MB.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('image', file);

    // Upload to backend
    const response = await axios.post<ImageUploadResponse>('http://localhost:5000/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true, // Include cookies for JWT
    });

    return response.data;
  } catch (error: any) {
    console.error('Image upload error:', error);
    
    if (error.response?.data) {
      return error.response.data;
    }
    
    return {
      success: false,
      message: 'Failed to upload image',
      error: error.message || 'Unknown error occurred'
    };
  }
};

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 3 * 1024 * 1024; // 3MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, JPG, PNG, and GIF files are allowed.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 3MB.'
    };
  }

  return { isValid: true };
};