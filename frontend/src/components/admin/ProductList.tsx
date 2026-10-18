import React, { useState, useCallback } from 'react';
import type { Product } from '../../types';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onFilterChange: (filters: { type?: 'banhmi' | 'drink'; searchTerm?: string }) => void;
  filters: { type?: 'banhmi' | 'drink'; searchTerm?: string };
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onFilterChange,
  filters
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

  // Handle search input change with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFilterChange({
        ...filters,
        searchTerm: value.trim() || undefined
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFilterChange]);

  // Handle type filter change
  const handleTypeFilterChange = useCallback((type: 'banhmi' | 'drink' | '') => {
    onFilterChange({
      ...filters,
      type: type || undefined
    });
  }, [filters, onFilterChange]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { text: '在庫切れ', className: 'bg-red-100 text-red-800' };
    } else if (stock < 5) {
      return { text: '在庫少', className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: '在庫あり', className: 'bg-green-100 text-green-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              商品検索
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="商品名で検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:w-48">
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              商品タイプ
            </label>
            <select
              id="type-filter"
              value={filters.type || ''}
              onChange={(e) => handleTypeFilterChange(e.target.value as 'banhmi' | 'drink' | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              <option value="banhmi">バインミー</option>
              <option value="drink">ドリンク</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {products.length} 件の商品が見つかりました
        </p>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">商品がありません</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.searchTerm || filters.type ? '検索条件に一致する商品がありません' : '最初の商品を追加してください'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            
            return (
              <div key={product._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{product.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.type === 'banhmi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.className}`}>
                      {stockStatus.text} ({product.stock})
                    </span>
                  </div>

                  {/* Product Options */}
                  {product.options.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">オプション:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.options.map((option, index) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {option.name} {option.extraCost > 0 && `+${formatPrice(option.extraCost)}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(product._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductList;