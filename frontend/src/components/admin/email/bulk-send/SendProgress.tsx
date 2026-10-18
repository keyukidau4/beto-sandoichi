import React from 'react';
import type { BulkSendProgress } from '../../../../types';

interface SendProgressProps {
  progress: BulkSendProgress;
  onClose?: () => void;
  className?: string;
}

const SendProgress: React.FC<SendProgressProps> = ({
  progress,
  onClose,
  className = ''
}) => {
  const { total, sent, failed, current, isComplete } = progress;
  const processed = sent + failed;
  const progressPercentage = total > 0 ? (processed / total) * 100 : 0;
  const successRate = processed > 0 ? (sent / processed) * 100 : 0;

  return (
    <div className={`bg-white border border-gray-300 rounded-md ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>{isComplete ? '✅' : '📤'}</span>
            <span>{isComplete ? '送信完了' : '送信中'}</span>
          </h4>
          {onClose && isComplete && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">進捗状況</span>
            <span className="font-medium">
              {processed}/{total} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                isComplete 
                  ? failed > 0 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-2xl font-bold text-green-600">{sent}</div>
            <div className="text-xs text-green-700">送信成功</div>
          </div>
          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-xs text-red-700">送信失敗</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="text-2xl font-bold text-gray-600">{total - processed}</div>
            <div className="text-xs text-gray-700">残り</div>
          </div>
        </div>

        {/* Current Status */}
        {!isComplete && current && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin">⏳</div>
              <span className="text-sm text-blue-800">
                現在送信中: {current}
              </span>
            </div>
          </div>
        )}

        {/* Success Rate */}
        {processed > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">成功率</span>
              <span className={`text-sm font-medium ${
                successRate >= 90 ? 'text-green-600' :
                successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(successRate)}%
              </span>
            </div>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && (
          <div className={`border rounded-md p-3 ${
            failed === 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <span className={failed === 0 ? 'text-green-600' : 'text-yellow-600'}>
                {failed === 0 ? '🎉' : '⚠️'}
              </span>
              <div className={`text-sm ${failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                {failed === 0 ? (
                  <p>
                    <strong>送信完了！</strong><br />
                    全{total}件のメールが正常に送信されました。
                  </p>
                ) : (
                  <p>
                    <strong>送信完了（一部失敗）</strong><br />
                    {sent}件が成功、{failed}件が失敗しました。<br />
                    失敗したメールは送信履歴から再送信できます。
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Estimated Time */}
        {!isComplete && total > processed && (
          <div className="text-xs text-gray-500 text-center">
            推定残り時間: 約{Math.ceil((total - processed) * 0.5 / 60)}分
            <br />
            （1件あたり約0.5秒の間隔で送信）
          </div>
        )}

        {/* Action Buttons */}
        {isComplete && (
          <div className="flex justify-center space-x-3 pt-2">
            {failed > 0 && (
              <button
                onClick={() => {
                  // Navigate to email history to resend failed emails
                  window.location.href = '/admin/email/history';
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              >
                失敗分を再送信
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                新しい送信を開始
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendProgress;