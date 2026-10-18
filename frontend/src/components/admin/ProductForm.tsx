import React, { useState, useEffect, useCallback } from 'react';
import { useCreateProductMutation, useUpdateProductMutation } from '../../services/api';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useAppDispatch } from '../../hooks';
import { addNotification } from '../../store/notificationSlice';
import type { Product, ProductOption } from '../../types';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  type: 'banhmi' | 'drink';
  description: string;
  price: number;
  stock: number;
  options: ProductOption[];
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  
  const {
    uploadedImageUrl,
    isUploading,
    error: uploadError,
    handleImageUpload,
    handleImageRemove
  } = useImageUpload(product?.imageUrl);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'banhmi',
    description: '',
    price: 0,
    stock: 0,
    options: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        type: product.type,
        description: product.description,
        price: product.price,
        stock: product.stock,
        options: [...product.options]
      });
    } else {
      setFormData({
        name: '',
        type: 'banhmi',
        description: '',
        price: 0,
        stock: 0,
        options: []
      });
    }
  }, [product]);

  // Handle input changes
  const handleInputChange = useCallback((
    field: keyof FormData,
    value: string | number | 'banhmi' | 'drink'
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle option changes
  const handleOptionChange = useCallback((index: number, field: keyof ProductOption, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  }, []);

  // Add new option
  const handleAddOption = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { name: '', extraCost: 0 }]
    }));
  }, []);

  // Remove option
  const handleRemoveOption = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  }, []);

  // Handle file drop
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  }, [handleImageUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '商品名は必須です';
    }

    if (!formData.description.trim()) {
      newErrors.description = '商品説明は必須です';
    }

    if (formData.price <= 0) {
      newErrors.price = '価格は0より大きい値を入力してください';
    }

    if (formData.stock < 0) {
      newErrors.stock = '在庫数は0以上の値を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const productData = {
        ...formData,
        imageUrl: uploadedImageUrl || undefined
      };

      let result;
      if (product) {
        // Update existing product
        result = await updateProduct({
          _id: product._id,
          ...productData
        }).unwrap();
      } else {
        // Create new product
        result = await createProduct(productData).unwrap();
      }

      if (result.success) {
        dispatch(addNotification({
          type: 'success',
          message: product ? '商品が正常に更新されました' : '商品が正常に作成されました'
        }));
        onSuccess();
      }
    } catch (error: unknown) {
      console.log({error});
      
      dispatch(addNotification({
        type: 'error',
        message: (product ? '商品の更新に失敗しました' : '商品の作成に失敗しました')
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, uploadedImageUrl, product, validateForm, createProduct, updateProduct, dispatch, onSuccess]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {product ? '商品編集' : '新しい商品を追加'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              商品名 *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="商品名を入力してください"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Product Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              商品タイプ *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as 'banhmi' | 'drink')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="banhmi">バインミー</option>
              <option value="drink">ドリンク</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              価格 (円) *
            </label>
            <input
              type="number"
              id="price"
              min="0"
              step="1"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              在庫数 *
            </label>
            <input
              type="number"
              id="stock"
              min="0"
              step="1"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.stock ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            商品説明 *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="商品の詳細説明を入力してください"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            商品画像
          </label>
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            {uploadedImageUrl ? (
              <div className="space-y-4">
                <img
                  src={uploadedImageUrl}
                  alt="Product preview"
                  className="mx-auto max-h-48 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  画像を削除
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-gray-600">
                  <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                    ファイルを選択
                  </label>
                  <span> またはドラッグ&ドロップ</span>
                </div>
                <p className="text-xs text-gray-500">JPEG, JPG, PNG, GIF (最大3MB)</p>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          {isUploading && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              アップロード中...
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
        </div>

        {/* Product Options */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              商品オプション
            </label>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + オプションを追加
            </button>
          </div>
          
          {formData.options.map((option, index) => (
            <div key={index} className="flex gap-4 items-center mb-3 p-3 border border-gray-200 rounded-md">
              <div className="flex-1">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                  placeholder="オプション名 (例: パクチー)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={option.extraCost}
                  onChange={(e) => handleOptionChange(index, 'extraCost', parseInt(e.target.value) || 0)}
                  placeholder="追加料金"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
          
          {formData.options.length === 0 && (
            <p className="text-sm text-gray-500 italic">オプションはありません</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {product ? '更新中...' : '作成中...'}
              </div>
            ) : (
              product ? '更新' : '作成'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;