import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { OrderPlacement, Cart } from '.';

const OrderMain: React.FC = () => {
  // const { totalAmount } = useAppSelector((state) => state.cart); // Will be used for display
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [showOrderPlacement, setShowOrderPlacement] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const handleStartOrder = () => {
    setShowOrderPlacement(true);
    setCompletedOrderId(null);
  };

  const handleOrderComplete = (orderId: string) => {
    setCompletedOrderId(orderId);
    setShowOrderPlacement(false);
  };

  const handleCancelOrder = () => {
    setShowOrderPlacement(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">ログインが必要です</h3>
          <p className="text-yellow-700">
            注文機能をご利用いただくには、ログインが必要です。
          </p>
        </div>
      </div>
    );
  }

  if (showOrderPlacement) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">注文手続き</h1>
          <p className="text-gray-600 mt-2">
            以下の手順で注文を完了してください
          </p>
        </div>
        
        <OrderPlacement
          onOrderComplete={handleOrderComplete}
          onCancel={handleCancelOrder}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">注文システム</h1>
      </div>

      {/* User Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="text-sm">
            <p className="text-blue-800 font-medium">ユーザー情報</p>
            <p className="text-blue-700 mt-1">
              ロール: <span className="font-semibold">{user?.role}</span> | 
              ステータス: <span className="font-semibold">{user?.status}</span>
            </p>
            {user?.status === 'pending' && (
              <p className="text-blue-600 text-xs mt-1">
                ※ 承認待ちのため、ポイント支払いは利用できません
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Order Completion Message */}
      {completedOrderId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-green-800">注文が完了しました！</h3>
              <p className="text-green-700 mt-1">
                注文ID: <span className="font-mono font-semibold">{completedOrderId}</span>
              </p>
              <p className="text-green-600 text-sm mt-2">
                ご注文ありがとうございました。商品の準備ができ次第、配送いたします。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Section */}
      <Cart 
        showCheckoutButton={true}
        onCheckout={handleStartOrder}
      />
    </div>
  );
};

export default OrderMain;