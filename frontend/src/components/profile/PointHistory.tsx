import React from 'react';
import { useGetPointTransactionsQuery } from '../../services/api';
import { useAppSelector } from '../../hooks';
import type { PointTransaction } from '../../types';

interface PointHistoryProps {
  userId?: string;
  className?: string;
}

const PointHistory: React.FC<PointHistoryProps> = ({ 
  userId, 
  className = '' 
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const targetUserId = userId || user?._id;
  
  const { 
    data: response, 
    isLoading, 
    error 
  } = useGetPointTransactionsQuery(targetUserId);

  const transactions = response?.data || [];

  const getTransactionTypeLabel = (type: PointTransaction['type']) => {
    switch (type) {
      case 'purchase_reward':
        return '購入特典';
      case 'bank_deposit_transfer_add':
        return '管理者追加';
      case 'purchase_deduction':
        return '購入使用';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: PointTransaction['type']) => {
    switch (type) {
      case 'purchase_reward':
      case 'bank_deposit_transfer_add':
        return 'text-green-600 bg-green-50';
      case 'purchase_deduction':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">ポイント履歴</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">ポイント履歴</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">ポイント履歴の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">ポイント履歴</h2>
        <p className="text-sm text-gray-600 mt-1">
          ポイントの獲得・使用履歴を確認できます
        </p>
      </div>

      <div className="px-6 py-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">ポイント履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(
                        transaction.type
                      )}`}
                    >
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                  
                  {transaction.note && (
                    <p className="mt-1 text-sm text-gray-600">
                      {transaction.note}
                    </p>
                  )}
                  
                  {transaction.orderId && (
                    <p className="mt-1 text-xs text-gray-500">
                      注文ID: {transaction.orderId}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">ポイント</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PointHistory;