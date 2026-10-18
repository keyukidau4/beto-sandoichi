import React from 'react';
import type { CartItem } from '../../types';

interface DeliveryInfo {
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
}

interface OrderConfirmationProps {
  items: CartItem[];
  deliveryInfo: DeliveryInfo;
  paymentType: '代引き' | 'ポイント';
  pointsUsed?: number;
  totalAmount: number;
  finalAmount: number;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
  className?: string;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  items,
  deliveryInfo,
  paymentType,
  pointsUsed = 0,
  totalAmount,
  finalAmount,
  onConfirm,
  onBack,
  loading = false,
  className = '',
}) => {
  const formatOptions = (options: string[]) => {
    if (options.length === 0) return 'オプションなし';
    return options.join(', ');
  };

  const getOptionsCost = (options: string[]) => {
    return options.includes('パクチー') ? 50 : 0;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">注文内容の確認</h2>
        <p className="text-sm text-gray-600 mt-1">
          以下の内容で注文を確定します。内容をご確認ください。
        </p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Order Items */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">注文商品</h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={`${item.productId}-${item.selectedOptions.join('-')}-${index}`} 
                   className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    オプション: {formatOptions(item.selectedOptions)}
                  </p>
                  <div className="text-xs text-gray-600 mt-1">
                    <span>単価: ¥{item.price}</span>
                    {getOptionsCost(item.selectedOptions) > 0 && (
                      <span className="ml-2">+ オプション: ¥{getOptionsCost(item.selectedOptions)}</span>
                    )}
                  </div>
                </div>

                {/* Quantity and Subtotal */}
                <div className="text-right">
                  <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-900">¥{item.subtotal.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">配送先情報</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className='text-left'>
                <span className="text-gray-600">お名前: </span>
                <span className="font-medium">{deliveryInfo.name}</span>
              </div>
              <div className='text-left'>
                <span className="text-gray-600">電話番号: </span>
                <span className="font-medium">{deliveryInfo.tel}</span>
              </div>
              <div className='text-left'>
                <span className="text-gray-600">郵便番号: </span>
                <span className="font-medium">{deliveryInfo.zip1}-{deliveryInfo.zip2}</span>
              </div>
              <div className='text-left'>
                <span className="text-gray-600">住所: </span>
                <span className="font-medium">{deliveryInfo.address1} {deliveryInfo.address2}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">お支払い情報</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">支払い方法:</span>
                <span className="font-medium">
                  {paymentType === '代引き' ? '代引き（現金）' : 'ポイント支払い'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">商品合計:</span>
                <span>¥{totalAmount.toLocaleString()}</span>
              </div>
              {paymentType === 'ポイント' && pointsUsed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">使用ポイント:</span>
                  <span className="text-blue-600">-¥{pointsUsed.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">お支払い金額:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ¥{finalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Point Earning Information */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-blue-800 font-medium">ポイント獲得について</p>
              <p className="text-blue-700 mt-1">
                この注文で <span className="font-semibold">{Math.floor(finalAmount / 100)}ポイント</span> を獲得予定です
                <br />
                <span className="text-xs text-blue-600">（100円につき1ポイント）</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                注文処理中...
              </div>
            ) : (
              '注文を確定する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;