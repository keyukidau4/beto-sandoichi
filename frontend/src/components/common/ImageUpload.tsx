import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onImageRemove?: () => void;
  currentImageUrl?: string | null;
  isUploading?: boolean;
  error?: string | null;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onImageRemove,
  currentImageUrl,
  isUploading = false,
  error,
  className = ''
}) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Call parent handler
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleRemove = () => {
    setPreview(null);
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 3 * 1024 * 1024, // 3MB
    multiple: false,
    disabled: isUploading
  });

  const getDropzoneClassName = () => {
    let baseClass = 'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ';
    
    if (isUploading) {
      baseClass += 'border-gray-300 bg-gray-50 cursor-not-allowed ';
    } else if (isDragReject) {
      baseClass += 'border-red-500 bg-red-50 ';
    } else if (isDragActive) {
      baseClass += 'border-blue-500 bg-blue-50 ';
    } else {
      baseClass += 'border-gray-300 hover:border-gray-400 ';
    }
    
    return baseClass + className;
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Uploading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div {...getRootProps()} className={getDropzoneClassName()}>
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
              <p>Uploading image...</p>
            </div>
          ) : isDragActive ? (
            <div className="text-blue-600">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Drop the image here</p>
            </div>
          ) : (
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium mb-2">Click to upload or drag and drop</p>
              <p className="text-sm">JPEG, JPG, PNG, GIF up to 3MB</p>
            </div>
          )}
        </div>
      )}

      {/* Error messages */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {fileRejections.length > 0 && (
        <div className="mt-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="text-sm text-red-600">
              <p className="font-medium">{file.name}:</p>
              <ul className="list-disc list-inside ml-2">
                {errors.map(error => (
                  <li key={error.code}>
                    {error.code === 'file-too-large' 
                      ? 'File is too large. Maximum size is 3MB.'
                      : error.code === 'file-invalid-type'
                      ? 'Invalid file type. Only JPEG, JPG, PNG, and GIF files are allowed.'
                      : error.message
                    }
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;