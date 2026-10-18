import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks';
import { addToCart } from '../../store/cartSlice';
import { addNotification } from '../../store/notificationSlice';
import { useProductView } from '../../services/apiHooks';
import type { Product } from '../../types';
import ProductOptions from './ProductOptions';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToCart = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { trackProductView } = useProductView();
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stock === 0;

  // Calculate subtotal including option costs
  const calculateSubtotal = () => {
    const optionsCost = selectedOptions.reduce((total, optionName) => {
      const option = product.options.find(opt => opt.name === optionName);
      return total + (option?.extraCost || 0);
    }, 0);
    return (product.price + optionsCost) * quantity;
  };

  const handleOptionChange = (optionName: string, selected: boolean) => {
    setSelectedOptions(prev => 
      selected 
        ? [...prev, optionName]
        : prev.filter(name => name !== optionName)
    );
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isOutOfStock) {
      dispatch(addNotification({
        type: 'error',
        message: 'この商品は在庫切れです',
      }));
      return;
    }

    if (quantity > product.stock) {
      dispatch(addNotification({
        type: 'error',
        message: `在庫が不足しています。在庫数: ${product.stock}`,
      }));
      return;
    }

    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      selectedOptions,
      subtotal: calculateSubtotal(),
      imageUrl: product.imageUrl,
    };

    dispatch(addToCart(cartItem));
    dispatch(addNotification({
      type: 'success',
      message: 'カートに追加しました',
    }));

    // Reset selections
    setSelectedOptions([]);
    setQuantity(1);
  };

  const handleCardClick = async () => {
    // Track product view for analytics
    await trackProductView(product._id);
    navigate(`/products/${product._id}`);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value));
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative bg-gray-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">画像なし</span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">在庫切れ</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {product.name}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            product.type === 'banhmi' 
              ? 'bg-orange-100 text-orange-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.description}
        </p>

        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-gray-900">
            ¥{product.price.toLocaleString()}
          </span>
          <span className={`text-sm ${
            product.stock > 5 ? 'text-green-600' : 
            product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            在庫: {product.stock}
          </span>
        </div>

        {/* Product Options */}
        {showAddToCart && product.options && product.options.length > 0 && (
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <ProductOptions
              options={product.options}
              selectedOptions={selectedOptions}
              onOptionChange={handleOptionChange}
              disabled={isOutOfStock}
            />
          </div>
        )}

        {/* Quantity and Add to Cart */}
        {showAddToCart && (
          <div className="" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-2">
              <label htmlFor={`quantity-${product._id}`} className="text-sm text-gray-700">
                数量:
              </label>
              <select
                id={`quantity-${product._id}`}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={isOutOfStock}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`mt-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer'
              }`}
            >
              {isOutOfStock ? '在庫切れ' : `カートに追加 (¥${calculateSubtotal().toLocaleString()})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;