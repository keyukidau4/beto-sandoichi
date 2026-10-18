import React from 'react';
import type { EmailTemplate } from '../../../../types';

interface EmailPreviewProps {
  template: EmailTemplate;
  recipientCount: number;
  sampleRecipient?: {
    name: string;
    email: string;
    point?: number;
  };
  className?: string;
}

interface SampleData {
  name: string;
  email: string;
  point: string;
  orderNumber: string;
  totalAmount: string;
  orderStatus: string;
  currentDate: string;
  systemName: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  template,
  recipientCount,
  sampleRecipient = {
    name: '田中太郎',
    email: 'tanaka@example.com',
    point: 1500
  },
  className = ''
}) => {
  const renderTemplate = (content: string, data: { name: string; email: string; point?: number }): string => {
    let rendered = content;
    
    const sampleData: SampleData = {
      name: data.name || '田中太郎',
      email: data.email || 'tanaka@example.com',
      point: data.point ? data.point.toLocaleString() : '1,500',
      orderNumber: 'ORD-20240101-001',
      totalAmount: '2,500',
      orderStatus: '配送中',
      currentDate: new Date().toLocaleDateString('ja-JP'),
      systemName: 'BanhMi App'
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return rendered;
  };

  const previewTitle = renderTemplate(template.title, sampleRecipient);
  const previewContent = renderTemplate(template.content, sampleRecipient);

  return (
    <div className={`bg-white border border-gray-300 rounded-md ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>👁️</span>
            <span>送信プレビュー</span>
          </h4>
          <span className="text-sm text-gray-600">
            {recipientCount}人に送信予定
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Email Header */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">件名:</span>
              <span className="text-gray-900 break-words">{previewTitle}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">宛先:</span>
              <span className="text-gray-600">{sampleRecipient.email} 他{recipientCount - 1}人</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">タイプ:</span>
              <span className="text-gray-600">
                {(() => {
                  switch (template.type) {
                    case 'approval': return '承認通知';
                    case 'general': return '一般';
                    case 'promotion': return 'プロモーション';
                    case 'order_confirmation': return '注文確認';
                    case 'status_update': return 'ステータス更新';
                    case 'point_notification': return 'ポイント通知';
                    default: return template.type;
                  }
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="border border-gray-200 rounded-md p-4 bg-white">
          <h5 className="text-sm font-medium text-gray-700 mb-3">メール内容:</h5>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        </div>

        {/* Personalization Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 flex-shrink-0">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">個人化について:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>各受信者に対して、プレースホルダーが個別の情報に置き換えられます</li>
                <li>上記は「{sampleRecipient.name}」さんの例です</li>
                <li>実際の送信では、各ユーザーの名前、メールアドレス、ポイント等が使用されます</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>テンプレートID: {template._id}</p>
          <p>作成日: {new Date(template.createdAt).toLocaleDateString('ja-JP')}</p>
          {template.placeholders && template.placeholders.length > 0 && (
            <p>使用プレースホルダー: {template.placeholders.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;