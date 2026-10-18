import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import PointHistory from './PointHistory';
import ContactRequestForm from './ContactRequestForm';
import ContactRequestHistory from './ContactRequestHistory';

interface BuyerProfileProps {
  className?: string;
  showPointHistory?: boolean;
  showContactForm?: boolean;
}

const BuyerProfile: React.FC<BuyerProfileProps> = ({ 
  className = '',
  showPointHistory = true,
  showContactForm = true
}) => {
  const { user, buyerProfile } = useAppSelector((state) => state.auth);
  const [activeTab] = useState<'profile' | 'contact' | 'history'>('profile');

  if (!user || !buyerProfile) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">プロフィール情報が見つかりません</p>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '承認待ち';
      case 'approved':
        return '承認済み';
      case 'blacklisted':
        return 'ブラックリスト';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'blacklisted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      {/* {showContactForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                プロフィール
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                お問い合わせ
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                お問い合わせ履歴
              </button>
            </nav>
          </div>
        </div>
      )} */}

      {/* Tab Content */}
      {(!showContactForm || activeTab === 'profile') && (
        <>
          {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">プロフィール情報</h2>
          <p className="text-sm text-gray-600 mt-1">
            アカウント情報と配送先住所
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {buyerProfile.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {buyerProfile.tel}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  アカウント状態
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    user.status
                  )}`}
                >
                  {getStatusLabel(user.status)}
                </span>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  郵便番号
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  〒{buyerProfile.zip1}-{buyerProfile.zip2}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所1
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {buyerProfile.address1}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  住所2
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {buyerProfile.address2 || '未設定'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Points Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">ポイント情報</h2>
          <p className="text-sm text-gray-600 mt-1">
            現在の保有ポイントと利用状況
          </p>
        </div>

        <div className="px-6 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  現在の保有ポイント
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {buyerProfile.point.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600">ポイント</span>
                </div>
              </div>
              <div className="text-blue-500">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                ポイント利用について
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 1ポイント = 1円として利用可能</li>
                <li>• 100円のお買い物で1ポイント獲得</li>
                <li>• ポイント支払いは承認済みアカウントのみ</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                アカウント状態
              </h4>
              {user.status === 'approved' ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">ポイント支払い利用可能</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">承認待ち（代引きのみ利用可能）</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

          {/* Point History */}
          {showPointHistory && (
            <PointHistory />
          )}

          {/* Profile Update Notice */}
          {!showContactForm && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    プロフィール情報の変更について
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    プロフィール情報を変更したい場合は、お問い合わせフォームからご連絡ください。
                    管理者が確認後、情報を更新いたします。
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contact Form Tab */}
      {showContactForm && activeTab === 'contact' && (
        <ContactRequestForm />
      )}

      {/* Contact History Tab */}
      {showContactForm && activeTab === 'history' && (
        <ContactRequestHistory />
      )}
    </div>
  );
};

export default BuyerProfile;