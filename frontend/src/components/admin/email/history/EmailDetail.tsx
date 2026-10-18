import React from 'react';
import type { EmailHistoryItem } from '../../../../types';
import EmailStatusBadge from '../common/EmailStatusBadge';

interface EmailDetailProps {
  emailHistory: EmailHistoryItem;
  onClose: () => void;
  onResend?: (historyId: string) => void;
  isOpen: boolean;
}

const EmailDetail: React.FC<EmailDetailProps> = ({
  emailHistory,
  onClose,
  onResend,
  isOpen
}) => {
  if (!isOpen) return null;

  console.log({emailHistory});
  
  
  // Safety check for emailHistory object
  if (!emailHistory || typeof emailHistory !== 'object') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">エラー</h2>
          <p className="text-gray-600 mb-4">メール詳細データが正しく読み込まれませんでした。</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getSuccessRate = () => {
    const total = emailHistory.recipientCount;
    if (total === 0) return 0;
    return Math.round((emailHistory.successCount / total) * 100);
  };

  const failedRecipients = emailHistory.recipients?.filter(r => r.status === 'failed') || [];
  const hasFailures = failedRecipients.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                メール送信詳細
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                送信日時: {formatDate(emailHistory.sentAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {typeof emailHistory.recipientCount === 'number' ? emailHistory.recipientCount : 0}
                </div>
                <div className="text-sm text-blue-700">総送信数</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {typeof emailHistory.successCount === 'number' ? emailHistory.successCount : 0}
                </div>
                <div className="text-sm text-green-700">成功</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {typeof emailHistory.failureCount === 'number' ? emailHistory.failureCount : 0}
                </div>
                <div className="text-sm text-red-700">失敗</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {getSuccessRate()}%
                </div>
                <div className="text-sm text-gray-700">成功率</div>
              </div>
            </div>

            {/* Template Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">テンプレート情報</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">件名:</span>
                  <span className="text-sm font-medium">
                    {typeof emailHistory.templateTitle === 'string' ? emailHistory.templateTitle : '不明'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ステータス:</span>
                  <EmailStatusBadge 
                    status={typeof emailHistory.status === 'string' ? emailHistory.status : 'failed'} 
                    size="sm" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">テンプレートID:</span>
                  <span className="text-sm font-mono text-gray-500">
                    {typeof emailHistory.templateId === 'string' ? emailHistory.templateId : '不明'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipients List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">受信者一覧</h3>
                {hasFailures && onResend && (
                  <button
                    onClick={() => onResend(emailHistory._id)}
                    className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    失敗分を再送信
                  </button>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          受信者
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          メールアドレス
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          送信時刻
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          エラー
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emailHistory.recipients?.length > 0 ? (
                        emailHistory.recipients.map((recipient, index) => (
                          <tr key={`${recipient.buyerId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {recipient.buyerName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {recipient.buyerEmail}
                            </td>
                            <td className="px-4 py-3">
                              <EmailStatusBadge 
                                status={typeof recipient.status === 'string' ? recipient.status : 'failed'} 
                                size="sm" 
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {recipient.sentAt ? formatDate(recipient.sentAt) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-red-600">
                              {recipient.error || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            受信者データがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Failed Recipients Summary */}
            {hasFailures && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">
                  送信失敗の詳細 ({failedRecipients.length}件)
                </h4>
                <div className="space-y-2">
                  {failedRecipients.map((recipient, index) => (
                    <div key={`failed-${recipient.buyerId}-${index}`} className="text-sm">
                      <span className="font-medium text-red-700">
                        {recipient.buyerName} ({recipient.buyerEmail})
                      </span>
                      {recipient.error && (
                        <span className="text-red-600 ml-2">
                          - {recipient.error}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDetail;