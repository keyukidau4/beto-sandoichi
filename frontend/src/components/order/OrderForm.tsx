import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';

interface DeliveryInfo {
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
}

interface OrderFormProps {
  onSubmit: (deliveryInfo: DeliveryInfo) => void;
  loading?: boolean;
  className?: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ 
  onSubmit, 
  loading = false, 
  className = '' 
}) => {
  const { buyerProfile } = useAppSelector((state) => state.auth);

  // Initialize form with buyer profile data if available
  const [formData, setFormData] = useState<DeliveryInfo>({
    name: buyerProfile?.name || '',
    tel: buyerProfile?.tel || '',
    zip1: buyerProfile?.zip1 || '',
    zip2: buyerProfile?.zip2 || '',
    address1: buyerProfile?.address1 || '',
    address2: buyerProfile?.address2 || '',
  });

  const [errors, setErrors] = useState<Partial<DeliveryInfo>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryInfo> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '名前は2文字以上で入力してください';
    }

    if (!formData.tel.trim()) {
      newErrors.tel = '電話番号は必須です';
    } else if (!/^[0-9-]+$/.test(formData.tel)) {
      newErrors.tel = '有効な電話番号を入力してください';
    }

    if (!formData.zip1.trim()) {
      newErrors.zip1 = '郵便番号（前3桁）は必須です';
    } else if (!/^[0-9]{3}$/.test(formData.zip1)) {
      newErrors.zip1 = '郵便番号（前3桁）を正しく入力してください';
    }

    if (!formData.zip2.trim()) {
      newErrors.zip2 = '郵便番号（後4桁）は必須です';
    } else if (!/^[0-9]{4}$/.test(formData.zip2)) {
      newErrors.zip2 = '郵便番号（後4桁）を正しく入力してください';
    }

    if (!formData.address1.trim()) {
      newErrors.address1 = '住所1は必須です';
    } else if (formData.address1.trim().length < 5) {
      newErrors.address1 = '住所1は5文字以上で入力してください';
    }

    if (!formData.address2.trim()) {
      newErrors.address2 = '住所2は必須です';
    } else if (formData.address2.trim().length < 3) {
      newErrors.address2 = '住所2は3文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DeliveryInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">配送先情報</h2>
        <p className="text-sm text-gray-600 mt-1">
          商品をお届けする住所を確認してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="山田太郎"
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-1">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="tel"
            value={formData.tel}
            onChange={(e) => handleInputChange('tel', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tel ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="090-1234-5678"
            disabled={loading}
          />
          {errors.tel && (
            <p className="mt-1 text-sm text-red-600">{errors.tel}</p>
          )}
        </div>

        {/* Postal Code Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            郵便番号 <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={formData.zip1}
                onChange={(e) => handleInputChange('zip1', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.zip1 ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="123"
                maxLength={3}
                disabled={loading}
              />
              {errors.zip1 && (
                <p className="mt-1 text-sm text-red-600">{errors.zip1}</p>
              )}
            </div>
            <span className="flex items-center text-gray-500">-</span>
            <div className="flex-1">
              <input
                type="text"
                value={formData.zip2}
                onChange={(e) => handleInputChange('zip2', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.zip2 ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="4567"
                maxLength={4}
                disabled={loading}
              />
              {errors.zip2 && (
                <p className="mt-1 text-sm text-red-600">{errors.zip2}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address 1 Field */}
        <div>
          <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
            住所1（都道府県・市区町村） <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address1"
            value={formData.address1}
            onChange={(e) => handleInputChange('address1', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address1 ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="東京都渋谷区渋谷"
            disabled={loading}
          />
          {errors.address1 && (
            <p className="mt-1 text-sm text-red-600">{errors.address1}</p>
          )}
        </div>

        {/* Address 2 Field */}
        <div>
          <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
            住所2（番地・建物名） <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="address2"
            value={formData.address2}
            onChange={(e) => handleInputChange('address2', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address2 ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="1-2-3 渋谷ビル 4F"
            disabled={loading}
          />
          {errors.address2 && (
            <p className="mt-1 text-sm text-red-600">{errors.address2}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                処理中...
              </div>
            ) : (
              '配送先情報を確認'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;