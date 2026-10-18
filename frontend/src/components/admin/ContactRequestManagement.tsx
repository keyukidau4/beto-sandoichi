import React, { useState } from 'react';
import { useGetContactRequestsQuery, useUpdateContactRequestMutation } from '../../services/api';
import type { ContactRequest } from '../../types';

interface ContactRequestManagementProps {
  className?: string;
}

const ContactRequestManagement: React.FC<ContactRequestManagementProps> = ({ 
  className = '' 
}) => {
  const { 
    data: response, 
    isLoading, 
    error,
    refetch 
  } = useGetContactRequestsQuery();
  
  const [updateContactRequest] = useUpdateContactRequestMutation();
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  const requests = response?.data || [];
  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

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

  const handleSelectRequest = (request: ContactRequest) => {
    setSelectedRequest(request);
    setAdminResponse(request.adminResponse || '');
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest || !adminResponse.trim()) {
      return;
    }

    setIsUpdating(true);
    try {
      await updateContactRequest({
        id: selectedRequest._id,
        adminResponse: adminResponse.trim(),
        status: 'done'
      }).unwrap();

      setSelectedRequest(null);
      setAdminResponse('');
      refetch();
    } catch (error) {
      console.error('Failed to update contact request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
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
        <div className="px-6 py-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">お問い合わせ一覧の読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">お問い合わせ管理</h2>
              <p className="text-sm text-gray-600 mt-1">
                ユーザーからのお問い合わせを管理・対応できます
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount}件の未対応
              </div>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="px-6 py-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              すべて ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              対応待ち ({requests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === 'done'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              対応完了 ({requests.filter(r => r.status === 'done').length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">お問い合わせ一覧</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500">該当するお問い合わせがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    onClick={() => handleSelectRequest(request)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRequest?._id === request._id ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            request.type
                          )}`}
                        >
                          {getTypeLabel(request.type)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      ユーザー: {(request.buyerId as any)?.email || 'Unknown'}
                    </p>

                    <p className="text-sm text-gray-900 line-clamp-2">
                      {request.content}
                    </p>

                    {request.status === 'pending' && (
                      <div className="mt-2 flex items-center text-yellow-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">対応が必要です</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request Detail & Response */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">
              {selectedRequest ? 'お問い合わせ詳細・回答' : 'お問い合わせを選択してください'}
            </h3>
          </div>

          <div className="p-6">
            {!selectedRequest ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                  </svg>
                </div>
                <p className="text-gray-500">左側のリストからお問い合わせを選択してください</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Request Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">お問い合わせ内容</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          selectedRequest.type
                        )}`}
                      >
                        {getTypeLabel(selectedRequest.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(selectedRequest.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRequest.content}
                    </p>
                  </div>
                </div>

                {/* Admin Response */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">管理者回答</h4>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="お問い合わせへの回答を入力してください..."
                    maxLength={1000}
                    disabled={selectedRequest.status === 'done'}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {adminResponse.length}/1000文字
                  </p>
                </div>

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setAdminResponse('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleUpdateRequest}
                      disabled={!adminResponse.trim() || isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          更新中...
                        </div>
                      ) : (
                        '回答して完了にする'
                      )}
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'done' && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-green-800">このお問い合わせは対応完了済みです</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactRequestManagement;