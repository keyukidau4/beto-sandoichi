import React from 'react';
import { useGetOrderQuery } from '../../services/api';
import { Container, Card, Button } from '../common';
import type { Order } from '../../types';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId, onBack }) => {
  const { data: orderResponse, error, isLoading } = useGetOrderQuery(orderId);

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

  if (isLoading) {
    return (
      <Container>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </Card>
        </div>
      </Container>
    );
  }

  if (error || !orderResponse?.data) {
    return (
      <Container>
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            ← 戻る
          </Button>
        </div>
        <Card className="text-center py-8">
          <div className="text-red-600">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold mb-2">注文詳細の読み込みに失敗しました</h3>
            <p className="text-gray-600">注文が見つからないか、サーバーエラーが発生しました。</p>
          </div>
        </Card>
      </Container>
    );
  }

  const order = orderResponse.data;

  return (
    <Container>
      <div className="mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          ← 戻る
        </Button>
      </div>

      <div className="space-y-6">
        {/* Order Header */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                注文詳細 #{order._id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                注文日時: {formatDate(order.createdAt)}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">支払方法</h3>
              <p className="text-gray-600">{getPaymentTypeText(order.paymentType)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">合計金額</h3>
              <p className="text-2xl font-bold text-blue-600">¥{order.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">注文ID</h3>
              <p className="text-gray-600 font-mono text-sm">{order._id}</p>
            </div>
          </div>
        </Card>

        {/* Order Items */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">注文商品</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {typeof item.productId === 'object' && item.productId.imageUrl ? (
                    <img
                      src={item.productId.imageUrl}
                      alt={typeof item.productId === 'object' ? item.productId.name : 'Product'}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {typeof item.productId === 'object' ? item.productId.name : 'Product'}
                  </h3>
                  {item.selectedOptions.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      オプション: {item.selectedOptions.join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">
                      数量: {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ¥{item.subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Points Information */}
        {((order.pointsUsed && order.pointsUsed > 0) || (order.pointsEarned && order.pointsEarned > 0)) && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ポイント情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(order.pointsUsed && order.pointsUsed > 0) ? (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">使用ポイント</h3>
                  <p className="text-2xl font-bold text-red-600">-{order.pointsUsed}pt</p>
                  <p className="text-sm text-red-600 mt-1">
                    ¥{order.pointsUsed.toLocaleString()} 相当
                  </p>
                </div>
              ): ''}
              {(order.pointsEarned && order.pointsEarned > 0) ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">獲得ポイント</h3>
                  <p className="text-2xl font-bold text-green-600">+{order.pointsEarned}pt</p>
                  <p className="text-sm text-green-600 mt-1">
                    ¥{order.pointsEarned.toLocaleString()} 相当
                  </p>
                </div>
              ): ''}
            </div>
          </Card>
        )}

        {/* Order Summary */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">注文サマリー</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">商品小計</span>
              <span className="font-semibold">¥{order.totalAmount.toLocaleString()}</span>
            </div>
            {(order.pointsUsed && order.pointsUsed > 0) ? (
              <div className="flex justify-between text-red-600">
                <span>ポイント使用</span>
                <span>-¥{order.pointsUsed.toLocaleString()}</span>
              </div>
            ): ''}
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>合計金額</span>
                <span className="text-blue-600">¥{(order.totalAmount - (order.pointsUsed || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default OrderDetails;