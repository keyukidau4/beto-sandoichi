import React from 'react';
import type { FieldError, FieldErrors } from 'react-hook-form';

interface FormErrorDisplayProps {
  error?: FieldError;
  className?: string;
}

/**
 * Component to display individual field validation errors
 */
export const FormFieldError: React.FC<FormErrorDisplayProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null;

  return (
    <div className={`mt-1 text-sm text-red-600 ${className}`}>
      <div className="flex items-center">
        <svg
          className="h-4 w-4 mr-1 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error.message}</span>
      </div>
    </div>
  );
};

interface FormErrorSummaryProps {
  errors: FieldErrors;
  title?: string;
  className?: string;
  showFieldNames?: boolean;
}

/**
 * Component to display a summary of all form validation errors
 */
export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({
  errors,
  title = 'フォームにエラーがあります',
  className = '',
  showFieldNames = true
}) => {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error?.message);

  if (errorEntries.length === 0) return null;

  const fieldNameMap: Record<string, string> = {
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワード確認',
    name: '名前',
    tel: '電話番号',
    zip1: '郵便番号（前3桁）',
    zip2: '郵便番号（後4桁）',
    address1: '住所1',
    address2: '住所2',
    type: 'タイプ',
    content: '内容',
    title: 'タイトル',
    price: '価格',
    stock: '在庫数',
    description: '説明',
    paymentType: '支払い方法',
    quantity: '数量'
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {errorEntries.map(([fieldName, error]) => (
                <li key={fieldName}>
                  {showFieldNames && (
                    <span className="font-medium">
                      {fieldNameMap[fieldName] || fieldName}:
                    </span>
                  )}{' '}
                  {String(error?.message || 'エラーが発生しました')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ApiErrorDisplayProps {
  error: any;
  className?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

/**
 * Component to display API errors in a user-friendly format
 */
export const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({
  error,
  className = '',
  showRetry = false,
  onRetry
}) => {
  if (!error) return null;

  const getErrorMessage = (error: any): string => {
    // Handle RTK Query errors
    if (error?.data?.message) {
      return error.data.message;
    }

    // Handle standard API errors
    if (error?.message) {
      return error.message;
    }

    // Handle network errors
    if (error?.status === 'FETCH_ERROR') {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    }

    // Handle timeout errors
    if (error?.status === 'TIMEOUT_ERROR') {
      return 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。';
    }

    // Handle specific HTTP status codes
    if (error?.status) {
      switch (error.status) {
        case 400:
          return '入力内容に問題があります。';
        case 401:
          return 'ログインが必要です。';
        case 403:
          return 'この操作を実行する権限がありません。';
        case 404:
          return '要求されたリソースが見つかりません。';
        case 409:
          return 'データが競合しています。';
        case 429:
          return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        case 500:
          return 'サーバーエラーが発生しました。';
        case 503:
          return 'サービスが一時的に利用できません。';
        default:
          return `エラーが発生しました (${error.status})`;
      }
    }

    return '予期しないエラーが発生しました。';
  };

  const getErrorType = (error: any): 'error' | 'warning' | 'info' => {
    if (error?.status >= 500) return 'error';
    if (error?.status === 401 || error?.status === 403) return 'warning';
    if (error?.status === 404) return 'info';
    return 'error';
  };

  const errorMessage = getErrorMessage(error);
  const errorType = getErrorType(error);

  const getColorClasses = () => {
    switch (errorType) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    switch (errorType) {
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`border rounded-md p-4 ${getColorClasses()} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {errorMessage}
          </p>
          
          {showRetry && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm bg-white border border-current rounded px-3 py-1 hover:bg-gray-50 transition-colors"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ValidationErrorDisplayProps {
  errors: string[];
  className?: string;
}

/**
 * Component to display validation errors from backend
 */
export const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  className = ''
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            入力内容を確認してください
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {errors.length === 1 ? (
              <p>{errors[0]}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};