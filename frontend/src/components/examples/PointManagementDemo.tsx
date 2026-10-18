import React, { useState } from 'react';
import { BuyerProfile } from '../profile';
import { PointManagement } from '../admin';
import { PointBalance, PointErrorHandler } from '../common';
import PaymentOptions from '../order/PaymentOptions';
import { useAppSelector } from '../../hooks';

const PointManagementDemo: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'buyer' | 'admin' | 'payment'>('buyer');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'代引き' | 'ポイント'>('代引き');
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  const handlePaymentSelect = (paymentType: '代引き' | 'ポイント', points?: number) => {
    setSelectedPayment(paymentType);
    setPointsToUse(points || 0);
  };

  const handleValidationError = (error: string | null) => {
    setPaymentError(error);
  };

  const tabs = [
    { id: 'buyer', label: 'Buyer View', description: 'ユーザー向けポイント表示' },
    { id: 'payment', label: 'Payment Flow', description: 'ポイント支払いフロー' },
    { id: 'admin', label: 'Admin View', description: '管理者向けポイント管理' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Point Management System Demo</h1>
          <p className="mt-2 text-gray-600">
            ポイント管理システムの各機能をデモンストレーションします
          </p>
        </div>

        {/* Point Balance Widget */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Point Balance Widget</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PointBalance size="small" />
            <PointBalance size="medium" />
            <PointBalance size="large" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'buyer' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Buyer Profile & Point History</h2>
              <BuyerProfile />
            </div>
          )}

          {activeTab === 'payment' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Options with Point Validation</h2>
              <div className="max-w-2xl">
                {/* Error Display */}
                {paymentError && (
                  <div className="mb-4">
                    <PointErrorHandler error={paymentError} />
                  </div>
                )}

                {/* Payment Options */}
                <PaymentOptions
                  totalAmount={1500}
                  onPaymentSelect={handlePaymentSelect}
                  selectedPayment={selectedPayment}
                  pointsToUse={pointsToUse}
                  onValidationError={handleValidationError}
                />

                {/* Payment Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Current Selection</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Payment Type: {selectedPayment}</div>
                    {selectedPayment === 'ポイント' && (
                      <div>Points to Use: {pointsToUse.toLocaleString()}</div>
                    )}
                    <div>Validation Error: {paymentError || 'None'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Point Management</h2>
              {user?.role === 'admin' ? (
                <PointManagement />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-yellow-800">管理者権限が必要です</h3>
                      <p className="mt-1 text-yellow-700">
                        この機能を利用するには管理者としてログインしてください。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Summary */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Implemented Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">User Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Point balance display in profile</li>
                <li>✅ Point transaction history</li>
                <li>✅ Point validation in payment flow</li>
                <li>✅ Error handling for insufficient points</li>
                <li>✅ Responsive point balance widget</li>
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Admin Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ User point management interface</li>
                <li>✅ Point addition/deduction with notes</li>
                <li>✅ User search and filtering</li>
                <li>✅ Point transaction history viewing</li>
                <li>✅ Bulk user management capabilities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointManagementDemo;