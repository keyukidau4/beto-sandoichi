import React from 'react';
import { useAppSelector, useAppDispatch, useNotification } from '../../hooks';
import { updateQuantity, removeFromCart, clearCart } from '../../store/cartSlice';
import type { CartItem } from '../../types';

interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, selectedOptions: string[], quantity: number) => void;
  onRemoveItem: (productId: string, selectedOptions: string[]) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(item.productId, item.selectedOptions);
    } else {
      onUpdateQuantity(item.productId, item.selectedOptions, newQuantity);
    }
  };

  const formatOptions = (options: string[]) => {
    if (options.length === 0) return 'オプションなし';
    return options.join(', ');
  };

  const getOptionsCost = (options: string[]) => {
    return options.includes('パクチー') ? 50 : 0;
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-md"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          オプション: {formatOptions(item.selectedOptions)}
        </p>
        <div className="text-sm text-gray-600 mt-1">
          <span>単価: ¥{item.price}</span>
          {getOptionsCost(item.selectedOptions) > 0 && (
            <span className="ml-2">+ オプション: ¥{getOptionsCost(item.selectedOptions)}</span>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="数量を減らす"
        >
          <span className="text-gray-600">−</span>
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="数量を増やす"
        >
          <span className="text-gray-600">+</span>
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">¥{item.subtotal.toLocaleString()}</p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemoveItem(item.productId, item.selectedOptions)}
        className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
        aria-label="商品を削除"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

interface CartProps {
  className?: string;
  showCheckoutButton?: boolean;
  onCheckout?: () => void;
}

const Cart: React.FC<CartProps> = ({ 
  className = '', 
  showCheckoutButton = true,
  onCheckout 
}) => {
  const dispatch = useAppDispatch();
  const notification = useNotification();
  const { items, totalAmount, totalItems, loading, error } = useAppSelector((state) => state.cart);

  const handleUpdateQuantity = (productId: string, selectedOptions: string[], quantity: number) => {
    dispatch(updateQuantity({ productId, selectedOptions, quantity }));
    notification.info('数量を更新しました');
  };

  const handleRemoveItem = (productId: string, selectedOptions: string[]) => {
    dispatch(removeFromCart({ productId, selectedOptions }));
    notification.success('商品をカートから削除しました');
  };

  const handleClearCart = () => {
    if (window.confirm('カートを空にしますか？')) {
      dispatch(clearCart());
      notification.success('カートを空にしました');
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V7a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">カートが空です</h3>
        <p className="text-gray-500">商品を追加してください</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Cart Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            ショッピングカート ({totalItems}点)
          </h2>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            >
              カートを空にする
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <CartItemComponent
              key={`${item.productId}-${item.selectedOptions.join('-')}-${index}`}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold text-gray-900">合計金額:</span>
          <span className="text-xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</span>
        </div>

        {showCheckoutButton && (
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            注文に進む
          </button>
        )}
      </div>
    </div>
  );
};

export default Cart;