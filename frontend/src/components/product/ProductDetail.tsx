import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProductQuery } from '../../services/api';
import { useAppDispatch } from '../../hooks';
import { addToCart } from '../../store/cartSlice';
import { addNotification } from '../../store/notificationSlice';
import { useProductView } from '../../services/apiHooks';
import ProductOptions from './ProductOptions';
import ApiLoadingSpinner from '../common/ApiLoadingSpinner';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { trackProductView } = useProductView();
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const { data, error, isLoading } = useGetProductQuery(id!);
  const product = data?.data;

  // Track product view when component mounts
  useEffect(() => {
    if (product) {
      trackProductView(product._id);
    }
  }, [product, trackProductView]);

  const isOutOfStock = product?.stock === 0;

  // Calculate subtotal including option costs
  const calculateSubtotal = () => {
    if (!product) return 0;
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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value));
  };

  const handleAddToCart = () => {
    if (!product) return;
    
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

  const handleBackToProducts = () => {
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <ApiLoadingSpinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          商品の読み込みに失敗しました
        </div>
        <button
          onClick={handleBackToProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          商品一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <button
          onClick={handleBackToProducts}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          商品一覧に戻る
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="relative">
          <div className="bg-gray-200 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                <span className="text-gray-400 text-lg">画像なし</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">在庫切れ</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                product.type === 'banhmi' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {product.type === 'banhmi' ? 'バインミー' : 'ドリンク'}
              </span>
              <span className={`text-sm font-medium ${
                product.stock > 5 ? 'text-green-600' : 
                product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                在庫: {product.stock}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            <p className="text-4xl font-bold text-gray-900">
              ¥{product.price.toLocaleString()}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">商品説明</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Product Options */}
          {product.options && product.options.length > 0 && (
            <div>
              <ProductOptions
                options={product.options}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
                disabled={isOutOfStock}
              />
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              数量
            </label>
            <select
              id="quantity"
              value={quantity}
              onChange={handleQuantityChange}
              disabled={isOutOfStock}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>商品価格:</span>
                <span>¥{product.price.toLocaleString()}</span>
              </div>
              {selectedOptions.length > 0 && (
                <div className="space-y-1">
                  {selectedOptions.map(optionName => {
                    const option = product.options.find(opt => opt.name === optionName);
                    return (
                      <div key={optionName} className="flex justify-between text-sm text-gray-600">
                        <span>{optionName}:</span>
                        <span>+¥{option?.extraCost?.toLocaleString() || 0}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>数量:</span>
                <span>×{quantity}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span>合計:</span>
                <span>¥{calculateSubtotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-3 px-6 rounded-md text-lg font-medium transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isOutOfStock ? '在庫切れ' : 'カートに追加'}
          </button>

          {/* Additional Information */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>• 商品の在庫状況は随時更新されます</p>
            <p>• オプションの追加料金は商品価格に含まれます</p>
            <p>• 配送料は別途かかります</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;