import React from 'react';
import { useNotification } from '../../hooks';
import { Button } from '../common';

const NotificationDemo: React.FC = () => {
  const notification = useNotification();

  const handleSuccessNotification = () => {
    notification.success('操作が正常に完了しました！');
  };

  const handleErrorNotification = () => {
    notification.error('エラーが発生しました。再度お試しください。');
  };

  const handleWarningNotification = () => {
    notification.warning('注意: この操作は元に戻せません。');
  };

  const handleInfoNotification = () => {
    notification.info('新しい機能が利用可能になりました。');
  };

  const handleCustomNotification = () => {
    notification.custom({
      type: 'success',
      message: 'カスタム通知: 10秒間表示されます',
      duration: 10000,
    });
  };

  const handleMultipleNotifications = () => {
    notification.success('1つ目の通知');
    setTimeout(() => notification.info('2つ目の通知'), 500);
    setTimeout(() => notification.warning('3つ目の通知'), 1000);
    setTimeout(() => notification.error('4つ目の通知'), 1500);
  };

  const handleClearAll = () => {
    notification.clearAll();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">通知システムデモ</h1>
        <p className="text-gray-600">
          様々なタイプの通知をテストできます。通知は画面右上に表示され、自動的に消えます。
        </p>
      </div>

      {/* Basic Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本的な通知</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={handleSuccessNotification} variant="success">
            成功通知
          </Button>
          <Button onClick={handleErrorNotification} variant="danger">
            エラー通知
          </Button>
          <Button onClick={handleWarningNotification} variant="warning">
            警告通知
          </Button>
          <Button onClick={handleInfoNotification} variant="info">
            情報通知
          </Button>
        </div>
      </div>

      {/* Advanced Notifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">高度な通知</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleCustomNotification} variant="primary">
            カスタム通知
            <span className="block text-xs opacity-75">10秒間表示</span>
          </Button>
          <Button onClick={handleMultipleNotifications} variant="secondary">
            複数通知
            <span className="block text-xs opacity-75">4つの通知を順次表示</span>
          </Button>
          <Button onClick={handleClearAll} variant="outline">
            すべてクリア
            <span className="block text-xs opacity-75">表示中の通知を削除</span>
          </Button>
        </div>
      </div>

      {/* Notification Types Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">通知タイプの説明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
              <div>
                <h3 className="font-medium text-green-800">成功通知</h3>
                <p className="text-sm text-green-700">
                  操作が正常に完了した時に使用。5秒間表示されます。
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mt-1"></div>
              <div>
                <h3 className="font-medium text-red-800">エラー通知</h3>
                <p className="text-sm text-red-700">
                  エラーが発生した時に使用。7秒間表示されます。
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mt-1"></div>
              <div>
                <h3 className="font-medium text-yellow-800">警告通知</h3>
                <p className="text-sm text-yellow-700">
                  注意が必要な時に使用。6秒間表示されます。
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
              <div>
                <h3 className="font-medium text-blue-800">情報通知</h3>
                <p className="text-sm text-blue-700">
                  一般的な情報を伝える時に使用。4秒間表示されます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">使用例</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">コンポーネントでの使用方法</h3>
            <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`import { useNotification } from '../../hooks';

const MyComponent = () => {
  const notification = useNotification();

  const handleSubmit = async () => {
    try {
      await submitData();
      notification.success('データを保存しました');
    } catch (error) {
      notification.error('保存に失敗しました');
    }
  };

  return <button onClick={handleSubmit}>保存</button>;
};`}
            </pre>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">利用可能なメソッド</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><code className="bg-white px-2 py-1 rounded">notification.success(message)</code> - 成功通知</li>
              <li><code className="bg-white px-2 py-1 rounded">notification.error(message)</code> - エラー通知</li>
              <li><code className="bg-white px-2 py-1 rounded">notification.warning(message)</code> - 警告通知</li>
              <li><code className="bg-white px-2 py-1 rounded">notification.info(message)</code> - 情報通知</li>
              <li><code className="bg-white px-2 py-1 rounded">notification.custom(options)</code> - カスタム通知</li>
              <li><code className="bg-white px-2 py-1 rounded">notification.clearAll()</code> - すべての通知をクリア</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;