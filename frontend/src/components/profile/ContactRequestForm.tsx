import React, { useState } from 'react';
import { useCreateContactRequestMutation } from '../../services/api';
import { useAppSelector } from '../../hooks';

interface ContactRequestFormProps {
  className?: string;
  onSuccess?: () => void;
}

const ContactRequestForm: React.FC<ContactRequestFormProps> = ({ 
  className = '',
  onSuccess 
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [createContactRequest, { isLoading }] = useCreateContactRequestMutation();
  
  const [formData, setFormData] = useState({
    type: 'update-info' as 'update-info' | 'general-inquiry' | 'complaint',
    content: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('ログインが必要です');
      return;
    }

    if (!formData.content.trim()) {
      setError('お問い合わせ内容を入力してください');
      return;
    }

    try {
      await createContactRequest({
        type: formData.type,
        content: formData.content.trim()
      }).unwrap();

      setSuccess('お問い合わせを送信しました。管理者が確認後、対応いたします。');
      setFormData({ type: 'update-info', content: '' });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.data?.message || 'お問い合わせの送信に失敗しました');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'update-info':
        return 'プロフィール情報変更';
      case 'general-inquiry':
        return '一般的なお問い合わせ';
      case 'complaint':
        return '苦情・要望';
      default:
        return type;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">お問い合わせフォーム</h2>
        <p className="text-sm text-gray-600 mt-1">
          プロフィール情報の変更やその他のお問い合わせはこちらから
        </p>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              お問い合わせ種別
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="update-info">{getTypeLabel('update-info')}</option>
              <option value="general-inquiry">{getTypeLabel('general-inquiry')}</option>
              <option value="complaint">{getTypeLabel('complaint')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              お問い合わせ内容
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="お問い合わせ内容を詳しくご記入ください..."
              required
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.content.length}/1000文字
            </p>
          </div>

          {formData.type === 'update-info' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    プロフィール情報変更について
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>変更したい項目と新しい情報を明記してください：</p>
                    <ul className="mt-1 list-disc list-inside">
                      <li>お名前</li>
                      <li>電話番号</li>
                      <li>郵便番号</li>
                      <li>住所1（都道府県・市区町村）</li>
                      <li>住所2（番地・建物名）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !formData.content.trim()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  送信中...
                </div>
              ) : (
                'お問い合わせを送信'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestForm;