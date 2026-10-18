import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useRegisterMutation } from '../../services/api';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { showSuccess, showError } from '../../store/notificationSlice';
import { registerSchema, type RegisterFormData } from '../../utils/validationSchemas';

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, className = '' }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [register] = useRegisterMutation();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      dispatch(loginStart());
      
      // Remove confirmPassword from the data before sending to API
      const { confirmPassword, ...registerData } = data;
      
      const result = await register(registerData).unwrap();
      
      dispatch(loginSuccess(result));
      dispatch(showSuccess('アカウントが作成されました。管理者の承認をお待ちください。'));
      reset();
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アカウント作成に失敗しました';
      dispatch(loginFailure(errorMessage));
      dispatch(showError(errorMessage));
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        新規登録
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            {...registerField('email')}
            type="email"
            id="email"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="example@email.com"
            disabled={loading || isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              {...registerField('password')}
              type="password"
              id="password"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="パスワードを入力"
              disabled={loading || isSubmitting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード確認 <span className="text-red-500">*</span>
            </label>
            <input
              {...registerField('confirmPassword')}
              type="password"
              id="confirmPassword"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="パスワードを再入力"
              disabled={loading || isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            {...registerField('name')}
            type="text"
            id="name"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="山田太郎"
            disabled={loading || isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-1">
            電話番号 <span className="text-red-500">*</span>
          </label>
          <input
            {...registerField('tel')}
            type="tel"
            id="tel"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.tel ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="090-1234-5678"
            disabled={loading || isSubmitting}
          />
          {errors.tel && (
            <p className="mt-1 text-sm text-red-600">{errors.tel.message}</p>
          )}
        </div>

        {/* Postal Code Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            郵便番号 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              {...registerField('zip1')}
              type="text"
              maxLength={3}
              className={`w-20 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.zip1 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123"
              disabled={loading || isSubmitting}
            />
            <span className="text-gray-500">-</span>
            <input
              {...registerField('zip2')}
              type="text"
              maxLength={4}
              className={`w-24 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.zip2 ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="4567"
              disabled={loading || isSubmitting}
            />
          </div>
          {(errors.zip1 || errors.zip2) && (
            <p className="mt-1 text-sm text-red-600">
              {errors.zip1?.message || errors.zip2?.message}
            </p>
          )}
        </div>

        {/* Address Fields */}
        <div>
          <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
            住所1（都道府県・市区町村） <span className="text-red-500">*</span>
          </label>
          <input
            {...registerField('address1')}
            type="text"
            id="address1"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.address1 ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="東京都渋谷区"
            disabled={loading || isSubmitting}
          />
          {errors.address1 && (
            <p className="mt-1 text-sm text-red-600">{errors.address1.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
            住所2（番地・建物名） <span className="text-red-500">*</span>
          </label>
          <input
            {...registerField('address2')}
            type="text"
            id="address2"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.address2 ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1-2-3 サンプルマンション101"
            disabled={loading || isSubmitting}
          />
          {errors.address2 && (
            <p className="mt-1 text-sm text-red-600">{errors.address2.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            loading || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          } text-white`}
        >
          {loading || isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              登録中...
            </div>
          ) : (
            'アカウント作成'
          )}
        </button>

        {/* Info Message */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>注意:</strong> アカウント作成後、管理者の承認が必要です。承認されるまでポイント決済はご利用いただけません。
          </p>
        </div>
      </form>
    </div>
  );
};