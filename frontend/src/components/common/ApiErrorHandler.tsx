import React from "react";
import { useApiErrorHandler } from "../../services";
import type { RTKQueryError } from "../../types";
import { getErrorMessage } from "../../types";

interface ApiErrorHandlerProps {
  error: RTKQueryError | null;
  fallbackMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Component for displaying API errors with consistent styling and behavior
 */
const ApiErrorHandler: React.FC<ApiErrorHandlerProps> = ({
  error,
  fallbackMessage = "エラーが発生しました",
  showRetry = false,
  onRetry,
  className = "",
}) => {
  const { handleApiError } = useApiErrorHandler();

  const errorMessage = React.useMemo(() => {
    if (!error) return fallbackMessage;
    return getErrorMessage(error, fallbackMessage);
  }, [error, fallbackMessage]);

  const errorType = React.useMemo(() => {
    if (!error) return "general";
    if ("status" in error) {
      if (typeof error.status === "number") {
        if (error.status >= 500) return "server";
        if (error.status === 404) return "notfound";
        if (error.status === 403) return "forbidden";
        if (error.status === 401) return "unauthorized";
      }
    }
    return "general";
  }, [error]);

  React.useEffect(() => {
    if (error) {
      handleApiError(error, fallbackMessage);
    }
  }, [error, fallbackMessage, handleApiError]);

  if (!error) return null;

  const getErrorIcon = () => {
    switch (errorType) {
      case "server":
        return "🔧";
      case "notfound":
        return "🔍";
      case "forbidden":
        return "🚫";
      case "unauthorized":
        return "🔐";
      default:
        return "⚠️";
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case "server":
        return "bg-red-50 border-red-200 text-red-800";
      case "notfound":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "forbidden":
      case "unauthorized":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3 flex-shrink-0">{getErrorIcon()}</span>
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {errorType === "server" && "サーバーエラー"}
            {errorType === "notfound" && "データが見つかりません"}
            {errorType === "forbidden" && "アクセス権限がありません"}
            {errorType === "unauthorized" && "認証が必要です"}
            {errorType === "general" && "エラー"}
          </h3>
          <p className="text-sm">{errorMessage}</p>

          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-white border border-current rounded text-sm hover:bg-gray-50 transition-colors"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiErrorHandler;
