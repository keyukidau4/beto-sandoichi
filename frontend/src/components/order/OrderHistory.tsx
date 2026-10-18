import React, { useState } from 'react';
import { useGetOrdersQuery } from '../../services/api';
import { Container, Card, Button } from '../common';
import { useNotification } from '../../hooks';
import OrderDetails from './OrderDetails';
import type { Order } from '../../types';

interface OrderItemProps {
  order: Order;
  onViewDetails: (orderId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '処理中';
      case 'paid':
        return '支払済み';
      case 'cancelled':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const getPaymentTypeText = (paymentType: Order['paymentType']) => {
    switch (paymentType) {
      case '代引き':
        return '代金引換';
      case 'ポイント':
        return 'ポイント支払い';
      default:
        return paymentType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              注文 #{order._id.slice(-8)}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
            <div>
              <span className="font-medium">注文日時:</span><br />
              {formatDate(order.createdAt)}
            </div>
            <div>
              <span className="font-medium">支払方法:</span><br />
              {getPaymentTypeText(order.paymentType)}
            </div>
            <div>
              <span className="font-medium">合計金額:</span><br />
              <span className="text-lg font-bold text-blue-600">
                ¥{order.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="mb-3">
            <span className="font-medium text-gray-700">注文商品:</span>
            <div className="mt-1">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {typeof item.productId === 'object' ? item.productId.name : 'Product'} × {item.quantity}
                  {item.selectedOptions.length > 0 && (
                    <span className="text-gray-500"> ({item.selectedOptions.join(', ')})</span>
                  )}
                </div>
              ))}
              {order.items.length > 2 && (
                <div className="text-sm text-gray-500">
                  他 {order.items.length - 2} 商品
                </div>
              )}
            </div>
          </div>

          {/* Points Information */}
          {((order.pointsUsed && order.pointsUsed > 0) || (order.pointsEarned && order.pointsEarned > 0)) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {order.pointsUsed && order.pointsUsed > 0 && (
                <div className="text-red-600">
                  使用ポイント: -{order.pointsUsed}pt
                </div>
              )}
              {order.pointsEarned && order.pointsEarned > 0 && (
                <div className="text-green-600">
                  獲得ポイント: +{order.pointsEarned}pt
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-0 md:ml-6">
          <Button
            onClick={() => onViewDetails(order._id)}
            variant="outline"
            size="sm"
          >
            詳細を見る
          </Button>
        </div>
      </div>
    </Card>
  );
};

const OrderHistory: React.FC = () => {
  const { data: ordersResponse, error, isLoading, refetch } = useGetOrdersQuery();
  
  const notification = useNotification();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
  };

  const handleRefresh = () => {
    refetch();
    notification.success('注文履歴を更新しました');
  };

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">注文履歴の読み込みに失敗しました</h3>
            <p className="text-gray-600 mb-4">
              {'status' in error && error.status === 401 
                ? 'ログインが必要です' 
                : 'サーバーエラーが発生しました'}
            </p>
            <Button onClick={handleRefresh} variant="primary">
              再試行
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  const orders = ordersResponse?.data || [];

  // Show order details if an order is selected
  if (selectedOrderId) {
    return <OrderDetails orderId={selectedOrderId} onBack={handleBackToList} />;
  }

  if (orders.length === 0) {
    return (
      <Container>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 font-japanese">
            注文履歴
          </h1>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            更新
          </Button>
        </div>

        <Card className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            注文履歴がありません
          </h3>
          <p className="text-gray-600 mb-6">
            まだ注文をされていません。商品を注文してみましょう。
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="primary"
          >
            商品を見る
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 font-japanese">
          注文履歴
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {orders.length} 件の注文
          </span>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            更新
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderItem
            key={order._id}
            order={order}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Pagination could be added here if needed */}
      {orders.length >= 10 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            さらに多くの注文履歴がある場合は、ページネーションを実装できます
          </p>
        </div>
      )}
    </Container>
  );
};

export default OrderHistory;