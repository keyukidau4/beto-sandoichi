import React, { useState } from 'react';
import {
  useGetInventoryOverviewQuery,
  useGetInventoryStatsQuery,
  useGetLowStockProductsQuery,
  useGetRecentStockHistoryQuery,
} from '../../services/staffApiHooks';
import InventoryStats from './InventoryStats';
import InventoryTable from './InventoryTable';
import LowStockAlert from './LowStockAlert';
import StockHistoryTable from './StockHistoryTable';
import ApiLoadingSpinner from '../common/ApiLoadingSpinner';

const InventoryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'low-stock' | 'history'>('overview');

  const {
    data: inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
    refetch: refetchInventory,
  } = useGetInventoryOverviewQuery();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGetInventoryStatsQuery();

  const {
    data: lowStockProducts,
    isLoading: lowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useGetLowStockProductsQuery();

  const {
    data: recentHistory,
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useGetRecentStockHistoryQuery(20);

  const handleRefresh = () => {
    refetchInventory();
    refetchStats();
    refetchLowStock();
    refetchHistory();
  };

  const tabs = [
    { id: 'overview', label: '在庫一覧', count: inventory?.length },
    { id: 'low-stock', label: '在庫不足', count: lowStockProducts?.length },
    { id: 'history', label: '在庫履歴', count: recentHistory?.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">在庫管理</h1>
          <p className="text-gray-600 mt-1">商品の在庫状況と履歴を確認できます</p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          更新
        </button>
      </div>

      {/* Stats Overview */}
      <InventoryStats
        stats={stats}
        loading={statsLoading}
        error={statsError}
      />

      {/* Low Stock Alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <LowStockAlert products={lowStockProducts} />
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              {inventoryLoading ? (
                <div className="flex justify-center py-8">
                  <ApiLoadingSpinner />
                </div>
              ) : inventoryError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    在庫データの読み込みに失敗しました
                  </div>
                  <button
                    onClick={() => refetchInventory()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    再試行
                  </button>
                </div>
              ) : inventory ? (
                <InventoryTable products={inventory} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  在庫データがありません
                </div>
              )}
            </div>
          )}

          {activeTab === 'low-stock' && (
            <div>
              {lowStockLoading ? (
                <div className="flex justify-center py-8">
                  <ApiLoadingSpinner />
                </div>
              ) : lowStockError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    在庫不足データの読み込みに失敗しました
                  </div>
                  <button
                    onClick={() => refetchLowStock()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    再試行
                  </button>
                </div>
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                <InventoryTable products={lowStockProducts} showLowStockOnly />
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    在庫不足の商品はありません
                  </h3>
                  <p className="text-gray-500">
                    すべての商品の在庫が十分にあります
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <ApiLoadingSpinner />
                </div>
              ) : historyError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-4">
                    在庫履歴の読み込みに失敗しました
                  </div>
                  <button
                    onClick={() => refetchHistory()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    再試行
                  </button>
                </div>
              ) : recentHistory ? (
                <StockHistoryTable history={recentHistory} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  在庫履歴がありません
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;