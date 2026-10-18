import React, { useState, useEffect } from 'react';
import type { EmailTemplate, CreateEmailTemplateRequest } from '../../types';

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  onSubmit: (data: CreateEmailTemplateRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<CreateEmailTemplateRequest>({
    title: '',
    content: '',
    type: 'general'
  });

  const [errors, setErrors] = useState<Partial<CreateEmailTemplateRequest>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        content: template.content,
        type: template.type
      });
    }
  }, [template]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateEmailTemplateRequest> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 200) {
      newErrors.title = 'タイトルは200文字以内で入力してください';
    }

    if (!formData.content.trim()) {
      newErrors.content = '内容は必須です';
    } else if (formData.content.length > 5000) {
      newErrors.content = '内容は5000文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateEmailTemplateRequest]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {template ? 'メールテンプレート編集' : 'メールテンプレート作成'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="メールのタイトルを入力"
            maxLength={200}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.title.length}/200文字
          </p>
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            テンプレートタイプ *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="general">一般</option>
            <option value="approval">承認通知</option>
            <option value="promotion">プロモーション</option>
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            内容 *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={10}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="メールの内容を入力&#10;&#10;使用可能な変数:&#10;{name} - ユーザー名&#10;{email} - メールアドレス"
            maxLength={5000}
          />
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.content.length}/5000文字
          </p>
          <div className="text-xs text-gray-600 mt-2">
            <p className="font-medium">使用可能な変数:</p>
            <ul className="list-disc list-inside ml-2">
              <li><code>{'{name}'}</code> - ユーザー名</li>
              <li><code>{'{email}'}</code> - メールアドレス</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '保存中...' : template ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailTemplateForm;