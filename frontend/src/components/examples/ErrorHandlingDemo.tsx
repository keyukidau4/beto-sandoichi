import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  FormFieldError, 
  FormErrorSummary, 
  ApiErrorDisplay, 
  ValidationErrorDisplay,
  ErrorBoundary 
} from '../common';
import { useErrorHandler } from '../../hooks';

// Demo form schema
const demoSchema = yup.object({
  email: yup.string().email('有効なメールアドレスを入力してください').required('メールアドレスは必須です'),
  name: yup.string().min(2, '名前は2文字以上で入力してください').required('名前は必須です'),
});

type DemoFormData = yup.InferType<typeof demoSchema>;

/**
 * Component that intentionally throws an error for testing ErrorBoundary
 */
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error for ErrorBoundary demonstration');
  }
  return <div className="text-green-600">No error thrown - component rendered successfully!</div>;
};

/**
 * Demo component showcasing comprehensive error handling
 */
const ErrorHandlingDemo: React.FC = () => {
  const [apiError, setApiError] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { handleError, handleApiError } = useErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DemoFormData>({
    resolver: yupResolver(demoSchema)
  });

  // Simulate different types of API errors
  const simulateApiError = (errorType: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      let error;
      
      switch (errorType) {
        case 'validation':
          error = {
            status: 400,
            data: {
              message: '入力内容に問題があります',
              code: 'VALIDATION_ERROR'
            }
          };
          break;
        case 'auth':
          error = {
            status: 401,
            data: {
              message: 'ログインが必要です',
              code: 'AUTHENTICATION_ERROR'
            }
          };
          break;
        case 'forbidden':
          error = {
            status: 403,
            data: {
              message: 'この操作を実行する権限がありません',
              code: 'AUTHORIZATION_ERROR'
            }
          };
          break;
        case 'notfound':
          error = {
            status: 404,
            data: {
              message: 'データが見つかりません',
              code: 'NOT_FOUND_ERROR'
            }
          };
          break;
        case 'server':
          error = {
            status: 500,
            data: {
              message: 'サーバーエラーが発生しました',
              code: 'INTERNAL_SERVER_ERROR'
            }
          };
          break;
        case 'network':
          error = {
            status: 'FETCH_ERROR',
            error: 'Network error'
          };
          break;
        case 'timeout':
          error = {
            status: 'TIMEOUT_ERROR',
            error: 'Request timeout'
          };
          break;
        default:
          error = new Error('Unknown error occurred');
      }
      
      setApiError(error);
      handleApiError(error, `Demo API Error - ${errorType}`);
      setIsLoading(false);
    }, 1000);
  };

  // Simulate validation errors from backend
  const simulateValidationErrors = () => {
    const errors = [
      'メールアドレスは既に使用されています',
      'パスワードは8文字以上である必要があります',
      '電話番号の形式が正しくありません'
    ];
    setValidationErrors(errors);
  };

  // Handle form submission
  const onSubmit = (data: DemoFormData) => {
    console.log('Form submitted:', data);
    handleError(null); // Clear any previous errors
    setApiError(null);
    setValidationErrors([]);
    alert('フォームが正常に送信されました！');
    reset();
  };

  // Test JavaScript error handling
  const testJavaScriptError = () => {
    try {
      // Simulate a JavaScript error
      const obj: any = null;
      obj.someProperty.nestedProperty = 'test';
    } catch (error) {
      handleError(error, 'JavaScript Error Demo');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Error Handling Demo</h2>
      
      <div className="space-y-6">
        {/* API Error Simulation */}
        <div>
          <h3 className="text-lg font-medium mb-3">API Error Simulation</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => simulateApiError('validation')}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Validation Error
            </button>
            <button
              onClick={() => simulateApiError('auth')}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Auth Error
            </button>
            <button
              onClick={() => simulateApiError('forbidden')}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Forbidden
            </button>
            <button
              onClick={() => simulateApiError('notfound')}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Not Found
            </button>
            <button
              onClick={() => simulateApiError('server')}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Server Error
            </button>
            <button
              onClick={() => simulateApiError('network')}
              disabled={isLoading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Network Error
            </button>
            <button
              onClick={() => simulateApiError('timeout')}
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            >
              Timeout
            </button>
            <button
              onClick={testJavaScriptError}
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded text-sm"
            >
              JS Error
            </button>
          </div>

          {apiError && (
            <ApiErrorDisplay
              error={apiError}
              showRetry={true}
              onRetry={() => {
                setApiError(null);
                console.log('Retrying...');
              }}
              className="mb-4"
            />
          )}
        </div>

        {/* Validation Error Display */}
        <div>
          <h3 className="text-lg font-medium mb-3">Backend Validation Errors</h3>
          <button
            onClick={simulateValidationErrors}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded mb-4"
          >
            Simulate Validation Errors
          </button>
          
          <ValidationErrorDisplay errors={validationErrors} />
        </div>

        {/* Form Validation Demo */}
        <div>
          <h3 className="text-lg font-medium mb-3">Form Validation Demo</h3>
          
          {Object.keys(errors).length > 0 && (
            <FormErrorSummary errors={errors} className="mb-4" />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                {...register('email')}
                type="email"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              <FormFieldError error={errors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                {...register('name')}
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="山田太郎"
              />
              <FormFieldError error={errors.name} />
            </div>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              送信
            </button>
          </form>
        </div>

        {/* ErrorBoundary Demo */}
        <div>
          <h3 className="text-lg font-medium mb-3">ErrorBoundary Demo</h3>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setShouldThrowError(!shouldThrowError)}
              className={`px-4 py-2 rounded text-white ${
                shouldThrowError 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {shouldThrowError ? 'Stop Throwing Error' : 'Throw Error'}
            </button>
            <span className="text-sm text-gray-600">
              Toggle to test ErrorBoundary component
            </span>
          </div>

          <ErrorBoundary
            fallback={
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-medium">Custom Error Fallback</h4>
                <p className="text-red-600 text-sm mt-1">
                  This is a custom fallback UI for this specific ErrorBoundary.
                </p>
                <button
                  onClick={() => setShouldThrowError(false)}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            }
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <ErrorThrowingComponent shouldThrow={shouldThrowError} />
            </div>
          </ErrorBoundary>
        </div>

        {/* Clear All Errors */}
        <div>
          <button
            onClick={() => {
              setApiError(null);
              setValidationErrors([]);
              setShouldThrowError(false);
              reset();
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Clear All Errors
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;