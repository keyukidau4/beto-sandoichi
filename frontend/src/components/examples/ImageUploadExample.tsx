import React from 'react';
import ImageUpload from '../common/ImageUpload';
import { useImageUpload } from '../../hooks/useImageUpload';

/**
 * Example component demonstrating image upload functionality
 * This can be used for testing and as a reference for implementation
 */
const ImageUploadExample: React.FC = () => {
  const {
    uploadedImageUrl,
    isUploading,
    error,
    handleImageUpload,
    handleImageRemove,
    resetUpload
  } = useImageUpload();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Image Upload Example</h2>
      
      <div className="mb-4">
        <ImageUpload
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
          currentImageUrl={uploadedImageUrl}
          isUploading={isUploading}
          error={error}
        />
      </div>

      {uploadedImageUrl && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            <strong>Upload successful!</strong>
          </p>
          <p className="text-green-600 text-xs mt-1 break-all">
            URL: {uploadedImageUrl}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={resetUpload}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          disabled={isUploading}
        >
          Reset
        </button>
        
        {uploadedImageUrl && (
          <button
            onClick={() => navigator.clipboard.writeText(uploadedImageUrl)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Copy URL
          </button>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Upload Requirements:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>File types: JPEG, JPG, PNG, GIF</li>
          <li>Maximum size: 3MB</li>
          <li>Images are automatically optimized</li>
          <li>Requires admin authentication</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUploadExample;