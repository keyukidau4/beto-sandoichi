import React from 'react';

interface ApiLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
  className?: string;
}

/**
 * Loading spinner component optimized for API calls
 */
const ApiLoadingSpinner: React.FC<ApiLoadingSpinnerProps> = ({
  size = 'md',
  message = '読み込み中...',
  overlay = false,
  className = '',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${getSizeClasses()} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
      />
      {message && (
        <p className={`mt-2 text-gray-600 ${getTextSize()}`}>
          {message}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

/**
 * Inline loading component for smaller spaces
 */
export const InlineApiLoader: React.FC<{ message?: string }> = ({ 
  message = '読み込み中...' 
}) => (
  <div className="flex items-center space-x-2 text-gray-600">
    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-sm">{message}</span>
  </div>
);

/**
 * Button loading state component
 */
export const ButtonLoader: React.FC<{ message?: string }> = ({ 
  message = '処理中...' 
}) => (
  <div className="flex items-center space-x-2">
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    <span>{message}</span>
  </div>
);

export default ApiLoadingSpinner;