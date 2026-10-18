# Image Upload Component

## Overview

The `ImageUpload` component provides a drag-and-drop interface for uploading images to Cloudinary via the backend API. It includes file validation, preview functionality, and error handling.

## Features

- **Drag & Drop**: Users can drag and drop images or click to select files
- **File Validation**: Validates file type (JPEG, JPG, PNG, GIF) and size (≤ 3MB)
- **Image Preview**: Shows preview of selected image before upload
- **Upload Progress**: Visual feedback during upload process
- **Error Handling**: Displays validation and upload errors
- **Remove Functionality**: Allows users to remove uploaded images

## Usage

### Basic Usage

```tsx
import ImageUpload from '../common/ImageUpload';
import { useImageUpload } from '../../hooks/useImageUpload';

const MyComponent = () => {
  const {
    uploadedImageUrl,
    isUploading,
    error,
    handleImageUpload,
    handleImageRemove
  } = useImageUpload();

  return (
    <ImageUpload
      onImageUpload={handleImageUpload}
      onImageRemove={handleImageRemove}
      currentImageUrl={uploadedImageUrl}
      isUploading={isUploading}
      error={error}
    />
  );
};
```

### With Initial Image

```tsx
const EditProductComponent = ({ product }) => {
  const {
    uploadedImageUrl,
    isUploading,
    error,
    handleImageUpload,
    handleImageRemove
  } = useImageUpload(product.imageUrl); // Pass initial image URL

  return (
    <ImageUpload
      onImageUpload={handleImageUpload}
      onImageRemove={handleImageRemove}
      currentImageUrl={uploadedImageUrl}
      isUploading={isUploading}
      error={error}
    />
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onImageUpload` | `(file: File) => void` | Yes | Callback when image is selected for upload |
| `onImageRemove` | `() => void` | No | Callback when image is removed |
| `currentImageUrl` | `string` | No | URL of currently uploaded image |
| `isUploading` | `boolean` | No | Whether upload is in progress |
| `error` | `string` | No | Error message to display |
| `className` | `string` | No | Additional CSS classes |

## File Requirements

- **Supported formats**: JPEG, JPG, PNG, GIF
- **Maximum size**: 3MB
- **Authentication**: Requires admin role for upload

## Backend Integration

The component integrates with the backend upload API:

- **Endpoint**: `POST /api/upload/image`
- **Authentication**: JWT token required (admin role)
- **Content-Type**: `multipart/form-data`
- **Response**: Cloudinary URL and metadata

## Error Handling

The component handles various error scenarios:

- Invalid file type
- File size too large
- Network errors
- Authentication errors
- Cloudinary upload errors

## Styling

The component uses Tailwind CSS classes and is fully responsive. It provides visual feedback for:

- Normal state
- Drag active state
- Drag reject state
- Loading state
- Error state

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management