import React, { useState } from 'react';

interface PlaceholderHelperProps {
  onInsert?: (placeholder: string) => void;
  className?: string;
}

const PLACEHOLDERS = [
  {
    category: 'ユーザー情報',
    items: [
      { key: '{{name}}', description: 'ユーザー名', example: '田中太郎' },
      { key: '{{email}}', description: 'メールアドレス', example: 'tanaka@example.com' },
      { key: '{{point}}', description: 'ポイント残高', example: '1,500' }
    ]
  },
  {
    category: '注文情報',
    items: [
      { key: '{{orderNumber}}', description: '注文番号', example: 'ORD-20240101-001' },
      { key: '{{totalAmount}}', description: '合計金額', example: '2,500' },
      { key: '{{orderStatus}}', description: '注文ステータス', example: '配送中' }
    ]
  },
  {
    category: 'システム情報',
    items: [
      { key: '{{currentDate}}', description: '現在の日付', example: '2024年1月1日' },
      { key: '{{systemName}}', description: 'システム名', example: 'BanhMi App' }
    ]
  }
];

const PlaceholderHelper: React.FC<PlaceholderHelperProps> = ({ 
  onInsert, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInsert = (placeholder: string) => {
    if (onInsert) {
      onInsert(placeholder);
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(placeholder);
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-md ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">🏷️</span>
          <span className="font-medium text-gray-700">プレースホルダー一覧</span>
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <p className="text-sm text-gray-600">
            以下のプレースホルダーをクリックして挿入できます
          </p>
          
          {PLACEHOLDERS.map((category) => (
            <div key={category.category} className="space-y-2">
              <h4 className="font-medium text-gray-800 text-sm">{category.category}</h4>
              <div className="grid grid-cols-1 gap-2">
                {category.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleInsert(item.key)}
                    className="text-left p-2 bg-white border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-blue-600 font-mono text-sm group-hover:text-blue-700">
                          {item.key}
                        </code>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">例: {item.example}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            💡 プレースホルダーは送信時に実際の値に置き換えられます
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceholderHelper;