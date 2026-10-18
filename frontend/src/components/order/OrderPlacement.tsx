import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch, useNotification } from '../../hooks';
import { useCreateOrderMutation, useGetProductsQuery } from '../../services/api';
import { clearCart } from '../../store/cartSlice';
import { setCurrentOrder } from '../../store/orderSlice';
import OrderForm from './OrderForm';
import PaymentOptions from './PaymentOptions';
import OrderConfirmation from './OrderConfirmation';
import type { CreateOrderRequest, OrderItem, Product } from '../../types';

interface DeliveryInfo {
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
}

type OrderStep = 'delivery' | 'payment' | 'confirmation';

interface OrderPlacementProps {
  onOrderComplete?: (orderId: string) => void;
  onCancel?: () => void;
  className?: string;
}

const OrderPlacement: React.FC<OrderPlacementProps> = ({
  onOrderComplete,
  onCancel,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const notification = useNotification();
  const { items, totalAmount } = useAppSelector((state) => state.cart);
  // const { user } = useAppSelector((state) => state.auth); // Will be used for user validation
  
  const [currentStep, setCurrentStep] = useState<OrderStep>('delivery');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [paymentType, setPaymentType] = useState<'代引き' | 'ポイント'>('代引き');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [stockValidationError, setStockValidationError] = useState<string>('');

  const { data: productsResponse } = useGetProductsQuery();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  // Validate stock before proceeding to each step
  const validateStock = (): boolean => {
    if (!productsResponse?.data) {
      setStockValidationError('商品情報を取得できませんでした。再度お試しください。');
      return false;
    }

    const products = productsResponse.data;
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = products.find((p: Product) => p._id === item.productId);
      
      if (!product) {
        stockErrors.push(`${item.name}が見つかりません`);
        continue;
      }

      if (product.stock < item.quantity) {
        stockErrors.push(
          `${item.name}の在庫が不足しています（在庫: ${product.stock}個、注文: ${item.quantity}個）`
        );
      }
    }

    if (stockErrors.length > 0) {
      setStockValidationError(stockErrors.join('\n'));
      return false;
    }

    setStockValidationError('');
    return true;
  };

  // Clear stock validation error when items change
  useEffect(() => {
    if (stockValidationError) {
      setStockValidationError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleDeliverySubmit = (info: DeliveryInfo) => {
    if (!validateStock()) {
      return;
    }
    setDeliveryInfo(info);
    setCurrentStep('payment');
  };

  const handlePaymentSelect = (payment: '代引き' | 'ポイント', points?: number) => {
    setPaymentType(payment);
    setPointsToUse(points || 0);
  };

  const handlePaymentNext = () => {
    if (!validateStock()) {
      return;
    }
    setCurrentStep('confirmation');
  };

  const handleConfirmOrder = async () => {
    if (!deliveryInfo || !validateStock()) {
      return;
    }

    try {
      const orderData: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
          subtotal: item.subtotal,
        })) as unknown as OrderItem[],
        paymentType,
        totalAmount,
        pointsUsed: paymentType === 'ポイント' ? pointsToUse : undefined,
      };

      const result = await createOrder(orderData);
      if (result.data && result.data?.success) {
        // Set the current order in the store
        dispatch(setCurrentOrder(result.data?.data));
        
        // Clear the cart
        dispatch(clearCart());
        
        // Show success notification
        notification.success('ご注文が正常に完了しました！');
        
        // Call the completion callback
        if (onOrderComplete) {
          onOrderComplete(result.data?.data._id);
        }
      }
    } catch (error: unknown) {
      console.error('Order creation failed:', error);

      const errorM = error as { data: { message: string } };

      // Handle specific error cases
      if (errorM.data?.message?.includes('在庫')) {
        setStockValidationError(errorM.data.message);
        notification.error('在庫不足のため注文を完了できませんでした');
        setCurrentStep('delivery'); // Go back to first step to show error
      } else if (errorM.data?.message?.includes('ポイント')) {
        setStockValidationError(errorM.data.message);
        notification.error('ポイント残高が不足しています');
        setCurrentStep('payment'); // Go back to payment step
      } else {
        const errorMessage = errorM.data?.message || '注文の作成に失敗しました。再度お試しください。';
        setStockValidationError(errorMessage);
        notification.error(errorMessage);
      }
    }
  };

  const handleBack = () => {
    setStockValidationError(''); // Clear any errors when going back
    
    switch (currentStep) {
      case 'payment':
        setCurrentStep('delivery');
        break;
      case 'confirmation':
        setCurrentStep('payment');
        break;
      default:
        if (onCancel) {
          onCancel();
        }
    }
  };

  const finalAmount = paymentType === 'ポイント' ? totalAmount - pointsToUse : totalAmount;

  // Don't render if cart is empty
  if (items.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V7a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">カートが空です</h3>
        <p className="text-gray-500">商品を追加してから注文手続きを行ってください</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Step 1: Delivery */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'delivery' 
                ? 'bg-blue-600 text-white' 
                : deliveryInfo 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
            }`}>
              {deliveryInfo ? '✓' : '1'}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === 'delivery' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              配送先
            </span>
          </div>

          <div className="w-8 h-0.5 bg-gray-300"></div>

          {/* Step 2: Payment */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'payment' 
                ? 'bg-blue-600 text-white' 
                : currentStep === 'confirmation'
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'confirmation' ? '✓' : '2'}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === 'payment' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              支払い方法
            </span>
          </div>

          <div className="w-8 h-0.5 bg-gray-300"></div>

          {/* Step 3: Confirmation */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'confirmation' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              確認
            </span>
          </div>
        </div>
      </div>

      {/* Stock Validation Error */}
      {stockValidationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">在庫エラー</h3>
              <div className="mt-1 text-sm text-red-700 whitespace-pre-line">
                {stockValidationError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {currentStep === 'delivery' && (
        <OrderForm
          onSubmit={handleDeliverySubmit}
          loading={false}
        />
      )}

      {currentStep === 'payment' && deliveryInfo && (
        <div className="space-y-6">
          <PaymentOptions
            totalAmount={totalAmount}
            onPaymentSelect={handlePaymentSelect}
            selectedPayment={paymentType}
            pointsToUse={pointsToUse}
          />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              戻る
            </button>
            <button
              type="button"
              onClick={handlePaymentNext}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              確認画面へ
            </button>
          </div>
        </div>
      )}

      {currentStep === 'confirmation' && deliveryInfo && (
        <OrderConfirmation
          items={items}
          deliveryInfo={deliveryInfo}
          paymentType={paymentType}
          pointsUsed={pointsToUse}
          totalAmount={totalAmount}
          finalAmount={finalAmount}
          onConfirm={handleConfirmOrder}
          onBack={handleBack}
          loading={isCreatingOrder}
        />
      )}
    </div>
  );
};

export default OrderPlacement;