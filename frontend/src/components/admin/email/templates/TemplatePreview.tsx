import React, { useState } from 'react';

interface TemplatePreviewProps {
  title: string;
  content: string;
  sampleData?: Record<string, any>;
  className?: string;
}

const DEFAULT_SAMPLE_DATA = {
  name: '田中太郎',
  email: 'tanaka@example.com',
  point: '1,500',
  orderNumber: 'ORD-20240101-001',
  totalAmount: '2,500',
  orderStatus: '配送中',
  currentDate: new Date().toLocaleDateString('ja-JP'),
  systemName: 'BanhMi App'
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  title,
  content,
  sampleData = DEFAULT_SAMPLE_DATA,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderTemplate = (template: string, data: Record<string, any>): string => {
    let rendered = template;
    
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return rendered;
  };

  const previewTitle = renderTemplate(title, sampleData);
  const previewContent = renderTemplate(content, sampleData);

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-md ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-green-600">👁️</span>
          <span className="font-medium text-gray-700">プレビュー</span>
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="bg-white border border-gray-300 rounded-md p-4 space-y-4">
            {/* Email Header */}
            <div className="border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <span>📧</span>
                <span>メールプレビュー</span>
              </div>
              <div className="space-y-1">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-16">件名:</span>
                  <span className="text-gray-900">{previewTitle || '（件名なし）'}</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-16">宛先:</span>
                  <span className="text-gray-600">{sampleData.email}</span>
                </div>
              </div>
            </div>

            {/* Email Content */}
            <div className="space-y-3">
              {previewContent ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <p className="text-gray-500 italic">（内容なし）</p>
              )}
            </div>

            {/* Sample Data Info */}
            <div className="border-t border-gray-200 pt-3">
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  使用されているサンプルデータ
                </summary>
                <div className="mt-2 bg-gray-50 p-2 rounded border">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(sampleData, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;