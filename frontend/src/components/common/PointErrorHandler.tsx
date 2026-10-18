import React from 'react';

interface PointErrorHandlerProps {
  error: string | null;
  className?: string;
  showIcon?: boolean;
}

const PointErrorHandler: React.FC<PointErrorHandlerProps> = ({
  error,
  className = '',
  showIcon = true
}) => {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
      <div className="flex">
        {showIcon && (
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
        )}
        <div className={showIcon ? "ml-3" : ""}>
          <h3 className="text-sm font-medium text-red-800">
            ポイント利用エラー
          </h3>
          <div className="mt-1 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointErrorHandler;