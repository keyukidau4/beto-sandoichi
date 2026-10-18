import React from 'react';
import { useGetProductStockHistoryQuery } from '../../services/staffApiHooks';
import StockHistoryTable from './StockHistoryTable';
import ApiLoadingSpinner from '../common/ApiLoadingSpinner';

interface ProductStockHistoryModalProps {
  productId: string;
  onClose: () => void;
}

const ProductStockHistoryModal: React.FC<ProductStockHistoryModalProps> = ({
  productId,
  onClose,
}) => {
  const {
    data: productHistory,
    isLoading,
    error,
    refetch,
  } = useGetProductStockHistoryQuery(productId);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              在庫履歴
            </h2>
            {productHistory && (
              <p className="text-sm text-gray-600 mt-1">
                {productHistory.product.name} - 現在の在庫: {productHistory.product.currentStock}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <ApiLoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                在庫履歴の読み込みに失敗しました
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                再試行
              </button>
            </div>
          ) : productHistory ? (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">商品名</label>
                    <p className="mt-1 text-sm text-gray-900">{productHistory.product.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">カテゴリー</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {productHistory.product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">現在の在庫</label>
                    <p className={`mt-1 text-sm font-medium ${
                      productHistory.product.currentStock === 0 
                        ? 'text-red-600' 
                        : productHistory.product.currentStock < 5 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    }`}>
                      {productHistory.product.currentStock}
                      {productHistory.product.currentStock === 0 && ' (在庫切れ)'}
                      {productHistory.product.currentStock > 0 && productHistory.product.currentStock < 5 && ' (在庫不足)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  在庫変更履歴 ({productHistory.history.length}件)
                </h3>
                <StockHistoryTable history={productHistory.history} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              データがありません
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductStockHistoryModal;