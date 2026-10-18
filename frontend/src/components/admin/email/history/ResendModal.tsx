import React, { useState } from 'react';
import type { EmailHistoryItem } from '../../../../types';

interface ResendModalProps {
  emailHistory: EmailHistoryItem;
  onClose: () => void;
  onConfirm: (historyId: string, recipientIds: string[]) => void;
  isOpen: boolean;
  isLoading?: boolean;
}

const ResendModal: React.FC<ResendModalProps> = ({
  emailHistory,
  onClose,
  onConfirm,
  isOpen,
  isLoading = false
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  if (!isOpen) return null;

  const failedRecipients = emailHistory.recipients.filter(r => r.status === 'failed');

  const handleRecipientToggle = (buyerId: string) => {
    setSelectedRecipients(prev => {
      const newSelection = prev.includes(buyerId)
        ? prev.filter(id => id !== buyerId)
        : [...prev, buyerId];
      
      setSelectAll(newSelection.length === failedRecipients.length);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecipients([]);
      setSelectAll(false);
    } else {
      setSelectedRecipients(failedRecipients.map(r => r.buyerId));
      setSelectAll(true);
    }
  };

  const handleConfirm = () => {
    if (selectedRecipients.length > 0) {
      onConfirm(emailHistory._id, selectedRecipients);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                メール再送信
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                失敗したメールを再送信します
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="space-y-6">
            {/* Email Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">送信情報</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">件名:</span>
                  <p className="font-medium">{emailHistory.templateTitle}</p>
                </div>
                <div>
                  <span className="text-gray-600">元の送信日時:</span>
                  <p className="font-medium">{formatDate(emailHistory.sentAt)}</p>
                </div>
                <div>
                  <span className="text-gray-600">総送信数:</span>
                  <p className="font-medium">{emailHistory.recipientCount}件</p>
                </div>
                <div>
                  <span className="text-gray-600">失敗数:</span>
                  <p className="font-medium text-red-600">{emailHistory.failureCount}件</p>
                </div>
              </div>
            </div>

            {/* Failed Recipients Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  再送信対象の選択 ({selectedRecipients.length}/{failedRecipients.length}件選択中)
                </h3>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  disabled={isLoading}
                >
                  {selectAll ? '全て解除' : '全て選択'}
                </button>
              </div>

              {failedRecipients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  再送信可能な失敗メールがありません
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              disabled={isLoading}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            受信者
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            エラー内容
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {failedRecipients.map((recipient, index) => (
                          <tr key={`${recipient.buyerId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(recipient.buyerId)}
                                onChange={() => handleRecipientToggle(recipient.buyerId)}
                                disabled={isLoading}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {recipient.buyerName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {recipient.buyerEmail}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-red-600">
                              {recipient.error || '不明なエラー'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            {selectedRecipients.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600 flex-shrink-0">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">再送信について:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>選択した{selectedRecipients.length}件のメールが再送信されます</li>
                      <li>同じテンプレート内容で送信されます</li>
                      <li>再送信の結果は新しい送信履歴として記録されます</li>
                      <li>送信には時間がかかる場合があります</li>
                    </ul>
                  </div>
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
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedRecipients.length === 0 || isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <span className="animate-spin">⏳</span>}
              <span>
                {isLoading 
                  ? '再送信中...' 
                  : `再送信 (${selectedRecipients.length}件)`
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendModal;