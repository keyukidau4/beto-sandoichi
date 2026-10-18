import React, { useState } from 'react';
import type { User, EmailTemplate } from '../../types';

interface EmailSenderProps {
  users: Array<User & { name?: string; tel?: string }>;
  templates: EmailTemplate[];
  onSendEmail: (userIds: string[], templateId: string) => void;
  loading?: boolean;
}

const EmailSender: React.FC<EmailSenderProps> = ({
  users,
  templates,
  onSendEmail,
  loading = false
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectAll, setSelectAll] = useState(false);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      // Update select all state
      setSelectAll(newSelection.length === users.length);
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(users.map(user => user._id));
      setSelectAll(true);
    }
  };

  const handleSendEmail = () => {
    if (selectedUsers.length === 0) {
      alert('送信先ユーザーを選択してください');
      return;
    }
    
    if (!selectedTemplate) {
      alert('メールテンプレートを選択してください');
      return;
    }

    const template = templates.find(t => t._id === selectedTemplate);
    const confirmMessage = `${selectedUsers.length}人のユーザーに「${template?.title}」を送信しますか？`;
    
    if (window.confirm(confirmMessage)) {
      onSendEmail(selectedUsers, selectedTemplate);
    }
  };

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">メール送信</h3>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メールテンプレート選択 *
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">テンプレートを選択してください</option>
          {templates.map((template) => (
            <option key={template._id} value={template._id}>
              [{getTypeLabel(template.type)}] {template.title}
            </option>
          ))}
        </select>
      </div>

      {/* Template Preview */}
      {selectedTemplate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h4>
          {(() => {
            const template = templates.find(t => t._id === selectedTemplate);
            return template ? (
              <div>
                <p className="text-sm font-medium mb-1">件名: {template.title}</p>
                <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {template.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* User Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            送信先ユーザー選択 * ({selectedUsers.length}/{users.length}人選択中)
          </label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectAll ? '全て解除' : '全て選択'}
          </button>
        </div>

        <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              送信可能なユーザーがいません
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <label
                  key={user._id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserToggle(user._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {user.tel && `TEL: ${user.tel}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSendEmail}
          disabled={loading || selectedUsers.length === 0 || !selectedTemplate}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '送信中...' : `メール送信 (${selectedUsers.length}人)`}
        </button>
      </div>
    </div>
  );
};

export default EmailSender;