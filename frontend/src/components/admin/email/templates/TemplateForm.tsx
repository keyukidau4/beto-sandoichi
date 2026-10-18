import React, { useState, useEffect } from 'react';
import { useCreateEmailTemplateMutation, useUpdateEmailTemplateMutation } from '../../../../services/api';
import type { EmailTemplate, CreateEmailTemplateRequest } from '../../../../types';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';
import PlaceholderHelper from '../common/PlaceholderHelper';

interface TemplateFormProps {
  template?: EmailTemplate;
  onCancel: () => void;
  onSuccess: () => void;
}

const TEMPLATE_TYPES = [
  { value: 'general', label: '一般' },
  { value: 'approval', label: '承認通知' },
  { value: 'promotion', label: 'プロモーション' },
  { value: 'order_confirmation', label: '注文確認' },
  { value: 'status_update', label: 'ステータス更新' },
  { value: 'point_notification', label: 'ポイント通知' }
] as const;

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onCancel,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateEmailTemplateRequest>({
    title: '',
    content: '',
    type: 'general'
  });

  const [errors, setErrors] = useState<Partial<CreateEmailTemplateRequest>>({});
  // const [showPreview, setShowPreview] = useState(false);

  const [createTemplate, { isLoading: createLoading }] = useCreateEmailTemplateMutation();
  const [updateTemplate, { isLoading: updateLoading }] = useUpdateEmailTemplateMutation();

  const isLoading = createLoading || updateLoading;
  const isEditing = !!template;

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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && template) {
        await updateTemplate({
          _id: template._id,
          ...formData
        }).unwrap();
      } else {
        await createTemplate(formData).unwrap();
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof CreateEmailTemplateRequest]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
    
    if (errors.content) {
      setErrors(prev => ({
        ...prev,
        content: undefined
      }));
    }
  };

  const handlePlaceholderInsert = (placeholder: string) => {
    // Insert placeholder at the end of content for now
    // In a real implementation, you might want to insert at cursor position
    setFormData(prev => ({
      ...prev,
      content: prev.content + placeholder
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">
          {isEditing ? 'メールテンプレート編集' : 'メールテンプレート作成'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
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
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
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
            {TEMPLATE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
          )}
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容 *
          </label>
          <TemplateEditor
            value={formData.content}
            onChange={handleContentChange}
            error={errors.content}
          />
        </div>

        {/* Placeholder Helper */}
        <PlaceholderHelper onInsert={handlePlaceholderInsert} />

        {/* Preview */}
        <TemplatePreview
          title={formData.title}
          content={formData.content}
        />

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
            disabled={isLoading}
          >
            {isLoading && <span className="animate-spin">⏳</span>}
            <span>{isLoading ? '保存中...' : isEditing ? '更新' : '作成'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateForm;