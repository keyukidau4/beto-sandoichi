import React from 'react';

interface HistoryFiltersProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    templateType: string;
    status: string;
    searchTerm: string;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
  className?: string;
}

const TEMPLATE_TYPES = [
  { value: '', label: '全てのタイプ' },
  { value: 'general', label: '一般' },
  { value: 'approval', label: '承認通知' },
  { value: 'promotion', label: 'プロモーション' },
  { value: 'order_confirmation', label: '注文確認' },
  { value: 'status_update', label: 'ステータス更新' },
  { value: 'point_notification', label: 'ポイント通知' }
];

const STATUS_OPTIONS = [
  { value: '', label: '全てのステータス' },
  { value: 'sending', label: '送信中' },
  { value: 'completed', label: '完了' },
  { value: 'failed', label: '失敗' }
];

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  className = ''
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFiltersChange({
      ...filters,
      [name]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={`bg-white border border-gray-200 rounded-md ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>🔍</span>
            <span>フィルター</span>
          </h4>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              リセット
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search Term */}
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
            検索キーワード
          </label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder="テンプレート名、受信者名で検索..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              送信日（開始）
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              送信日（終了）
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Template Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-1">
              テンプレートタイプ
            </label>
            <select
              id="templateType"
              name="templateType"
              value={filters.templateType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TEMPLATE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              送信ステータス
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600 flex-shrink-0">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">適用中のフィルター:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {filters.searchTerm && (
                    <li>検索: "{filters.searchTerm}"</li>
                  )}
                  {filters.dateFrom && (
                    <li>開始日: {new Date(filters.dateFrom).toLocaleDateString('ja-JP')}</li>
                  )}
                  {filters.dateTo && (
                    <li>終了日: {new Date(filters.dateTo).toLocaleDateString('ja-JP')}</li>
                  )}
                  {filters.templateType && (
                    <li>タイプ: {TEMPLATE_TYPES.find(t => t.value === filters.templateType)?.label}</li>
                  )}
                  {filters.status && (
                    <li>ステータス: {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryFilters;