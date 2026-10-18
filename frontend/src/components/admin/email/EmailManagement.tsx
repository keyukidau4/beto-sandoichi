import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import TemplateList from './templates/TemplateList';
import TemplateForm from './templates/TemplateForm';
import BulkEmailForm from './bulk-send/BulkEmailForm';
import EmailHistory from './history/EmailHistory';

const EmailManagement: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Get current active tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/email/templates')) return 'templates';
    if (path.includes('/email/bulk-send')) return 'bulk-send';
    if (path.includes('/email/history')) return 'history';
    return 'templates'; // default
  };

  const activeTab = getCurrentTab();

  const tabs = [
    { id: 'templates' as const, label: 'テンプレート管理', icon: '📝' },
    { id: 'bulk-send' as const, label: '一括送信', icon: '📧' },
    { id: 'history' as const, label: '送信履歴', icon: '📊' }
  ];

  const handleTabClick = (tabId: string) => {
    navigate(`/admin/email/${tabId}`);
    if (tabId !== 'templates') {
      setShowTemplateForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-3 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/email/templates" replace />} />
            
            <Route path="/templates" element={
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">メールテンプレート管理</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      メールテンプレートの作成、編集、削除を行えます
                    </p>
                  </div>
                  {!showTemplateForm && (
                    <button
                      onClick={() => setShowTemplateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                    >
                      <span>➕</span>
                      <span>新規作成</span>
                    </button>
                  )}
                </div>

                {showTemplateForm ? (
                  <TemplateForm
                    onCancel={() => setShowTemplateForm(false)}
                    onSuccess={() => setShowTemplateForm(false)}
                  />
                ) : (
                  <TemplateList onEdit={() => setShowTemplateForm(true)} />
                )}
              </div>
            } />
            
            <Route path="/bulk-send" element={
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">一括メール送信</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    複数のユーザーに一度にメールを送信できます（最大10人まで）
                  </p>
                </div>
                <BulkEmailForm />
              </div>
            } />
            
            <Route path="/history" element={
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">メール送信履歴</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    過去に送信したメールの履歴と状況を確認できます
                  </p>
                </div>
                <EmailHistory />
              </div>
            } />
            
            <Route path="*" element={<Navigate to="/admin/email/templates" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default EmailManagement;