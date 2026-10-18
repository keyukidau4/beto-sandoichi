import React, { useState } from 'react';
import { useGetEmailTemplatesQuery, useDeleteEmailTemplateMutation } from '../../../../services/api';
import type { EmailTemplate } from '../../../../types';
// import EmailStatusBadge from '../common/EmailStatusBadge';

interface TemplateListProps {
  templates?: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onSelect?: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
  selectable?: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates: propTemplates,
  onEdit,
  onSelect,
  selectedTemplateId,
  selectable = false
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const { data: templatesResponse, isLoading } = useGetEmailTemplatesQuery();
  const [deleteTemplate, { isLoading: deleteLoading }] = useDeleteEmailTemplateMutation();

  const templates = propTemplates || templatesResponse?.data || [];

  const getTypeLabel = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'approval':
        return '承認通知';
      case 'general':
        return '一般';
      case 'promotion':
        return 'プロモーション';
      case 'order_confirmation':
        return '注文確認';
      case 'status_update':
        return 'ステータス更新';
      case 'point_notification':
        return 'ポイント通知';
      default:
        return type;
    }
  };

  const getTypeColor = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'approval':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'general':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'promotion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'order_confirmation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'status_update':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'point_notification':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (templateId: string) => {
    try {
      await deleteTemplate(templateId).unwrap();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          メールテンプレートがありません
        </h3>
        <p className="text-gray-500">
          新規作成ボタンから最初のテンプレートを作成してください
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">メールテンプレート一覧</h3>
          <span className="text-sm text-gray-500">{templates.length}件</span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {templates.map((template) => (
          <div
            key={template._id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              selectedTemplateId === template._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            } ${selectable ? 'cursor-pointer' : ''}`}
            onClick={() => selectable && onSelect?.(template)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {template.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(
                      template.type
                    )}`}
                  >
                    {getTypeLabel(template.type)}
                  </span>
                  {template.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      デフォルト
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {(() => {
                    const plainText = stripHtml(template.content);
                    return plainText.length > 150
                      ? `${plainText.substring(0, 150)}...`
                      : plainText;
                  })()}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>作成: {formatDate(template.createdAt)}</span>
                  {template.updatedAt !== template.createdAt && (
                    <span>更新: {formatDate(template.updatedAt)}</span>
                  )}
                  {template.placeholders && template.placeholders.length > 0 && (
                    <span>プレースホルダー: {template.placeholders.length}個</span>
                  )}
                </div>
              </div>
              
              {!selectable && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(template);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    編集
                  </button>
                  
                  {deleteConfirm === template._id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template._id);
                        }}
                        disabled={deleteLoading}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleteLoading ? '削除中...' : '確認'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(null);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(template._id);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateList;