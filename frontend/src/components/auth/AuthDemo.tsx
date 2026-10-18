import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { RoleBasedRender, AdminOnly, BuyerOnly, ApprovedOnly, useCanUsePoints } from './RoleBasedRender';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logout } from '../../store/authSlice';
import { showSuccess } from '../../store/notificationSlice';

export const AuthDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { isAuthenticated, user, buyerProfile } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const canUsePoints = useCanUsePoints();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(showSuccess('ログアウトしました'));
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful!');
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">ユーザー情報</h2>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
            >
              ログアウト
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">基本情報</h3>
              <div className="space-y-2">
                <p><span className="font-medium">メール:</span> {user.email}</p>
                <p><span className="font-medium">ロール:</span> {user.role}</p>
                <p><span className="font-medium">ステータス:</span> {user.status}</p>
                <p><span className="font-medium">最終ログイン:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ja-JP') : '未記録'}</p>
              </div>
            </div>
            
            {buyerProfile && (
              <div>
                <h3 className="text-lg font-semibold mb-3">購入者プロフィール</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">名前:</span> {buyerProfile.name}</p>
                  <p><span className="font-medium">電話:</span> {buyerProfile.tel}</p>
                  <p><span className="font-medium">郵便番号:</span> {buyerProfile.zip1}-{buyerProfile.zip2}</p>
                  <p><span className="font-medium">住所:</span> {buyerProfile.address1} {buyerProfile.address2}</p>
                  <p><span className="font-medium">ポイント:</span> {buyerProfile.point}pt</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role-based rendering examples */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">ロールベース表示テスト</h3>
          
          <div className="space-y-4">
            <AdminOnly fallback={<p className="text-gray-500">管理者のみ表示</p>}>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 font-medium">🔧 管理者専用コンテンツ</p>
                <p className="text-red-600 text-sm">ユーザー管理、商品管理、分析データなど</p>
              </div>
            </AdminOnly>

            <BuyerOnly fallback={<p className="text-gray-500">購入者のみ表示</p>}>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-800 font-medium">🛒 購入者専用コンテンツ</p>
                <p className="text-green-600 text-sm">注文履歴、ポイント履歴、プロフィール管理など</p>
              </div>
            </BuyerOnly>

            <ApprovedOnly fallback={<p className="text-gray-500">承認済みユーザーのみ表示</p>}>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 font-medium">✅ 承認済みユーザー専用コンテンツ</p>
                <p className="text-blue-600 text-sm">ポイント決済、特別オファーなど</p>
              </div>
            </ApprovedOnly>

            <RoleBasedRender 
              allowedRoles={['admin', 'staff']} 
              fallback={<p className="text-gray-500">管理者・スタッフのみ表示</p>}
            >
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <p className="text-purple-800 font-medium">👥 管理者・スタッフ専用コンテンツ</p>
                <p className="text-purple-600 text-sm">在庫管理、注文管理など</p>
              </div>
            </RoleBasedRender>
          </div>
        </div>

        {/* Payment options demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">決済オプション</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="cod"
                name="payment"
                value="代引き"
                className="mr-2"
                defaultChecked
              />
              <label htmlFor="cod" className="text-gray-700">代引き（全ユーザー利用可能）</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="points"
                name="payment"
                value="ポイント"
                className="mr-2"
                disabled={!canUsePoints}
              />
              <label 
                htmlFor="points" 
                className={`${canUsePoints ? 'text-gray-700' : 'text-gray-400'}`}
              >
                ポイント決済
                {!canUsePoints && (
                  <span className="text-sm text-red-500 ml-2">
                    （承認済み購入者のみ利用可能）
                  </span>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'login'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ログイン
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'register'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          新規登録
        </button>
      </div>

      {/* Form Content */}
      {activeTab === 'login' ? (
        <LoginForm onSuccess={handleAuthSuccess} />
      ) : (
        <RegisterForm onSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};