import React from 'react';
import type { EmailTemplate } from '../../types';

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onDelete: (templateId: string) => void;
  onSelect?: (template: EmailTemplate) => void;
  selectedTemplateId?: string;
  loading?: boolean;
}

const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  templates,
  onEdit,
  onDelete,
  onSelect,
  selectedTemplateId,
  loading = false
}) => {
  const getTypeLabel = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'approval':
        return '承認通知';
      case 'general':
        return '一般';
      case 'promotion':
        return 'プロモーション';
      default:
        return type;
    }
  };

  const getTypeColor = (type: EmailTemplate['type']) => {
    switch (type) {
      case 'approval':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">メールテンプレートがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">メールテンプレート一覧</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {templates.map((template) => (
          <div
            key={template._id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              selectedTemplateId === template._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            } ${onSelect ? 'cursor-pointer' : ''}`}
            onClick={() => onSelect?.(template)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {template.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      template.type
                    )}`}
                  >
                    {getTypeLabel(template.type)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {template.content.length > 100
                    ? `${template.content.substring(0, 100)}...`
                    : template.content}
                </p>
                
                <p className="text-xs text-gray-500">
                  作成日: {formatDate(template.createdAt)}
                  {template.updatedAt !== template.createdAt && (
                    <span className="ml-2">
                      更新日: {formatDate(template.updatedAt)}
                    </span>
                  )}
                </p>
              </div>
              
              {!onSelect && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(template);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    編集
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('このテンプレートを削除しますか？')) {
                        onDelete(template._id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplateList;