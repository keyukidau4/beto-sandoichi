import React, { useState } from 'react';
import { 
  useGetAdminOrdersQuery, 
  useGetAdminOrderDetailQuery,
  useUpdateAdminOrderStatusMutation 
} from '../../services/api';

interface OrderFilters {
  status?: 'pending' | 'paid' | 'cancelled';
  paymentType?: '代引き' | 'ポイント';
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

interface OrderListTableProps {
  orders: Array<{
    _id: string;
    orderNumber: string;
    buyerName: string;
    buyerEmail: string;
    totalAmount: number;
    paymentType: '代引き' | 'ポイント';
    status: 'pending' | 'paid' | 'cancelled';
    createdAt: string;
    itemCount: number;
  }>;
  onOrderSelect: (orderId: string) => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  isUpdating: boolean;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

interface OrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">フィルター</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="pending">保留中</option>
            <option value="paid">支払済み</option>
            <option value="cancelled">キャンセル</option>
          </select>
        </div>

        {/* Payment Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            支払方法
          </label>
          <select
            value={filters.paymentType || ''}
            onChange={(e) => handleFilterChange('paymentType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="代引き">代引き</option>
            <option value="ポイント">ポイント</option>
          </select>
        </div>

        {/* Search Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            検索（注文ID・顧客名・メール）
          </label>
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            placeholder="検索キーワード"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            開始日
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            終了日
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

const OrderListTable: React.FC<OrderListTableProps> = ({ 
  orders, 
  onOrderSelect, 
  onStatusUpdate, 
  isUpdating 
}) => {


  const getPaymentTypeBadge = (paymentType: string) => {
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        paymentType === '代引き' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {paymentType}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注文ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                顧客情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                支払方法
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                注文日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                商品数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.orderNumber.slice(-8)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.buyerName}</div>
                  <div className="text-sm text-gray-500">{order.buyerEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ¥{order.totalAmount.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPaymentTypeBadge(order.paymentType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusUpdate(order._id, e.target.value)}
                    disabled={isUpdating}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">保留中</option>
                    <option value="paid">支払済み</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString('ja-JP')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.itemCount}点</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onOrderSelect(order._id)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, isOpen, onClose }) => {
  const { data: orderDetailResponse, isLoading, error } = useGetAdminOrderDetailQuery(orderId, {
    skip: !isOpen || !orderId,
  });

  const orderDetail = orderDetailResponse?.data;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">注文詳細</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">注文詳細の取得に失敗しました</p>
          </div>
        )}

        {orderDetail && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">注文情報</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">注文ID:</span> {orderDetail.orderNumber.slice(-8)}</p>
                  <p><span className="font-medium">ステータス:</span> {orderDetail.status}</p>
                  <p><span className="font-medium">支払方法:</span> {orderDetail.paymentType}</p>
                  <p><span className="font-medium">合計金額:</span> ¥{orderDetail.totalAmount.toLocaleString()}</p>
                  {orderDetail.pointsUsed && (
                    <p><span className="font-medium">使用ポイント:</span> {orderDetail.pointsUsed}pt</p>
                  )}
                  {orderDetail.pointsEarned && (
                    <p><span className="font-medium">獲得ポイント:</span> {orderDetail.pointsEarned}pt</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">顧客情報</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">名前:</span> {orderDetail.buyerName}</p>
                  <p><span className="font-medium">メール:</span> {orderDetail.buyerEmail}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <h4 className="font-semibold mb-2">配送先</h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p>{orderDetail.deliveryAddress.name}</p>
                <p>{orderDetail.deliveryAddress.tel}</p>
                <p>〒{orderDetail.deliveryAddress.zip}</p>
                <p>{orderDetail.deliveryAddress.address}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold mb-2">注文商品</h4>
              <div className="space-y-2">
                {orderDetail.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">数量: {item.quantity}</p>
                        {item.selectedOptions.length > 0 && (
                          <p className="text-sm text-gray-600">
                            オプション: {item.selectedOptions.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">¥{item.subtotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <p><span className="font-medium">注文日時:</span> {new Date(orderDetail.createdAt).toLocaleString('ja-JP')}</p>
              <p><span className="font-medium">更新日時:</span> {new Date(orderDetail.updatedAt).toLocaleString('ja-JP')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { 
    data: ordersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetAdminOrdersQuery({
    page: currentPage,
    limit: 20,
    ...filters,
  });

  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateAdminOrderStatusMutation();

  const orders = ordersResponse?.data?.orders || [];
  const pagination = ordersResponse?.data?.pagination;

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus({ 
        id: orderId, 
        status: status as 'pending' | 'paid' | 'cancelled' 
      }).unwrap();
      // Refetch to get updated data
      refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleCloseModal = () => {
    setSelectedOrderId(null);
  };

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">注文データの取得に失敗しました</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">注文管理</h2>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          更新
        </button>
      </div>

      {/* Filters */}
      <OrderFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">注文が見つかりません</p>
        </div>
      ) : (
        <>
          <OrderListTable
            orders={orders}
            onOrderSelect={handleOrderSelect}
            onStatusUpdate={handleStatusUpdate}
            isUpdating={isUpdating}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                前へ
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                {currentPage} / {pagination.totalPages} ページ
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default OrderManagement;