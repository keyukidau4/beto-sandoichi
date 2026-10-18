import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { UserManagement } from './index';
import { PointManagement } from './index';
import { ContactRequestManagement } from './index';
import { ProductManagement } from './index';
import { OrderManagement } from './index';
import { Analytics } from './index';
import { EmailManagement } from './index';
import { Breadcrumb } from '../common/Navigation';

const AdminDemo: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // Only show admin demo if user is authenticated and is an admin
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            管理者としてログインしてください。管理機能にアクセスするには管理者権限が必要です。
          </p>
        </div>
      </div>
    );
  }

  // Get current active tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/admin/email')) return 'email';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/points')) return 'points';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/analytics')) return 'analytics';
    if (path.includes('/admin/contacts')) return 'contacts';
    return 'users'; // default
  };

  const activeTab = getCurrentTab();

  // Navigation handler
  const handleTabClick = (tab: string) => {
    navigate(`/admin/${tab}`);
  };

  // Breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      { label: 'ホーム', onClick: () => navigate('/') },
      { label: '管理者パネル', onClick: () => navigate('/admin') }
    ];

    const path = location.pathname;
    if (path.includes('/admin/email')) {
      items.push({ label: 'メール管理', onClick: () => navigate('/admin/email') });
      if (path.includes('/templates')) {
        items.push({ label: 'テンプレート管理', onClick: () => navigate('/admin/email/templates') });
      } else if (path.includes('/bulk-send')) {
        items.push({ label: '一括送信', onClick: () => navigate('/admin/email/bulk-send') });
      } else if (path.includes('/history')) {
        items.push({ label: '送信履歴', onClick: () => navigate('/admin/email/history') });
      }
    } else if (path.includes('/admin/users')) {
      items.push({ label: 'ユーザー管理', onClick: () => navigate('/admin/users') });
    } else if (path.includes('/admin/products')) {
      items.push({ label: '商品管理', onClick: () => navigate('/admin/products') });
    } else if (path.includes('/admin/points')) {
      items.push({ label: 'ポイント管理', onClick: () => navigate('/admin/points') });
    } else if (path.includes('/admin/orders')) {
      items.push({ label: '注文管理', onClick: () => navigate('/admin/orders') });
    } else if (path.includes('/admin/analytics')) {
      items.push({ label: 'アナリティクス', onClick: () => navigate('/admin/analytics') });
    } else if (path.includes('/admin/contacts')) {
      items.push({ label: 'お問い合わせ管理', onClick: () => navigate('/admin/contacts') });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-4">
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          {/* Header */}
          <div className="pb-4">
            <h1 className="text-2xl font-bold text-gray-900">管理者パネル</h1>
            <p className="text-gray-600">システムの管理機能にアクセスできます</p>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabClick('users')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ユーザー管理
              </button>
              <button
                onClick={() => handleTabClick('products')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                商品管理
              </button>
              <button
                onClick={() => handleTabClick('points')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'points'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ポイント管理
              </button>
              <button
                onClick={() => handleTabClick('orders')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                注文管理
              </button>
              <button
                onClick={() => handleTabClick('analytics')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                アナリティクス
              </button>
              <button
                onClick={() => handleTabClick('contacts')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contacts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                お問い合わせ管理
              </button>
              <button
                onClick={() => handleTabClick('email')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                メール管理
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/points" element={<PointManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/contacts" element={<ContactRequestManagement />} />
          <Route path="/email/*" element={<EmailManagement />} />
          <Route path="*" element={<Navigate to="/admin/users" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDemo;