import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import InventoryDashboard from './InventoryDashboard';

const StaffDemo: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [showDemo, setShowDemo] = useState(false);

  // Check if user is staff or admin
  const canAccessStaffFeatures = user && (user.role === 'staff' || user.role === 'admin');

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Staff Inventory Management Demo</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-800">
              スタッフ機能を使用するには、スタッフまたは管理者としてログインしてください。
            </p>
          </div>
          <div className="mt-3 text-sm text-yellow-700">
            <p>テスト用アカウント:</p>
            <ul className="list-disc list-inside mt-1">
              <li>スタッフ: staff@test.com / password123</li>
              <li>管理者: admin@test.com / password123</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessStaffFeatures) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Staff Inventory Management Demo</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
            <p className="text-red-800">
              この機能にアクセスする権限がありません。スタッフまたは管理者権限が必要です。
            </p>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>現在のロール: {user?.role}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Staff Inventory Management Demo</h2>
        <button
          onClick={() => setShowDemo(!showDemo)}
          className={`px-4 py-2 rounded-md transition-colors ${
            showDemo
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showDemo ? 'デモを閉じる' : 'デモを開く'}
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <p>
          <strong>ログイン中:</strong> {user?.email} ({user?.role})
        </p>
        <p className="mt-1">
          スタッフ向けの在庫管理機能をテストできます。在庫一覧、在庫不足アラート、在庫履歴などの機能が含まれています。
        </p>
      </div>

      {showDemo && (
        <div className="border-t pt-6">
          <InventoryDashboard />
        </div>
      )}

      {!showDemo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">機能一覧:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 📦 在庫一覧表示（商品名、カテゴリー、在庫数、価格）</li>
            <li>• ⚠️ 在庫不足アラート（在庫数 &lt; 5の商品）</li>
            <li>• 📊 在庫統計（総商品数、在庫不足数、在庫切れ数、総在庫価値）</li>
            <li>• 📋 在庫変更履歴（注文による減少、管理者調整、入荷）</li>
            <li>• 🔍 商品詳細表示（読み取り専用）</li>
            <li>• 📈 商品別在庫履歴</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default StaffDemo;