import React from 'react';
import { useGetUserContactRequestsQuery } from '../../services/api';
import type { ContactRequest } from '../../types';

interface ContactRequestHistoryProps {
  className?: string;
}

const ContactRequestHistory: React.FC<ContactRequestHistoryProps> = ({ 
  className = '' 
}) => {
  const { 
    data: response, 
    isLoading, 
    error 
  } = useGetUserContactRequestsQuery();

  const requests = response?.data || [];

  const getTypeLabel = (type: ContactRequest['type']) => {
    switch (type) {
      case 'update-info':
        return 'プロフィール情報変更';
      case 'general-inquiry':
        return '一般的なお問い合わせ';
      case 'complaint':
        return '苦情・要望';
      default:
        return type;
    }
  };

  const getTypeColor = (type: ContactRequest['type']) => {
    switch (type) {
      case 'update-info':
        return 'bg-blue-100 text-blue-800';
      case 'general-inquiry':
        return 'bg-green-100 text-green-800';
      case 'complaint':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ContactRequest['status']) => {
    switch (status) {
      case 'pending':
        return '対応待ち';
      case 'done':
        return '対応完了';
      default:
        return status;
    }
  };

  const getStatusColor = (status: ContactRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-lg font-semibold text-gray-900">お問い合わせ履歴</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">お問い合わせ履歴</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">お問い合わせ履歴の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">お問い合わせ履歴</h2>
        <p className="text-sm text-gray-600 mt-1">
          過去のお問い合わせと対応状況を確認できます
        </p>
      </div>

      <div className="px-6 py-4">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">お問い合わせ履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        request.type
                      )}`}
                    >
                      {getTypeLabel(request.type)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </span>
                </div>

                <div className="mb-3 flex items-start flex-col">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    お問い合わせ内容：
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                    {request.content}
                  </p>
                </div>

                {request.adminResponse && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      管理者からの回答
                    </h4>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                      {request.adminResponse}
                    </p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="mt-3 flex items-center text-yellow-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">管理者による対応をお待ちください</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactRequestHistory;