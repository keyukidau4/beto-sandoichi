import React, { useState } from 'react';
import type { InventoryItem } from '../../types/staff';

interface LowStockAlertProps {
  products: InventoryItem[];
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ products }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!products || products.length === 0) {
    return null;
  }

  const outOfStockProducts = products.filter(p => p.stock === 0);
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            在庫アラート
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              {outOfStockProducts.length > 0 && (
                <>
                  <span className="font-medium">{outOfStockProducts.length}件</span>の商品が在庫切れです。
                </>
              )}
              {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && ' '}
              {lowStockProducts.length > 0 && (
                <>
                  <span className="font-medium">{lowStockProducts.length}件</span>の商品の在庫が不足しています。
                </>
              )}
            </p>
            
            {!isExpanded && products.length > 0 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="mt-2 text-yellow-800 hover:text-yellow-900 underline text-sm"
              >
                詳細を表示
              </button>
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-3">
              {outOfStockProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    在庫切れ商品 ({outOfStockProducts.length}件)
                  </h4>
                  <div className="space-y-1">
                    {outOfStockProducts.map((product) => (
                      <div key={product._id} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-yellow-200">
                        <div className="flex items-center">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-8 w-8 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          在庫: {product.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lowStockProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    在庫不足商品 ({lowStockProducts.length}件)
                  </h4>
                  <div className="space-y-1">
                    {lowStockProducts.map((product) => (
                      <div key={product._id} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-yellow-200">
                        <div className="flex items-center">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-8 w-8 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          在庫: {product.stock}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsExpanded(false)}
                className="text-yellow-800 hover:text-yellow-900 underline text-sm"
              >
                詳細を非表示
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;