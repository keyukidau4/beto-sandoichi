import { useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { showError, showWarning, showInfo } from '../store/notificationSlice';
import { ErrorService, ErrorSeverity, ErrorCategory } from '../services/errorService';
import { logout } from '../store/authSlice';

/**
 * Hook for handling errors consistently across the application
 */
export const useErrorHandler = () => {
  const dispatch = useAppDispatch();

  const handleError = useCallback((error: any, context?: string) => {
    const processedError = ErrorService.processError(error);
    
    // Log error for debugging/monitoring
    ErrorService.logError(processedError, context);

    // Handle authentication errors by logging out user
    if (processedError.category === ErrorCategory.AUTHENTICATION) {
      dispatch(logout());
      dispatch(showError('セッションが切れました。再度ログインしてください。'));
      return;
    }

    // Show appropriate notification based on severity
    switch (processedError.severity) {
      case ErrorSeverity.LOW:
        dispatch(showInfo(processedError.message));
        break;
      case ErrorSeverity.MEDIUM:
        dispatch(showWarning(processedError.message));
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        dispatch(showError(processedError.message));
        break;
      default:
        dispatch(showError(processedError.message));
    }

    return processedError;
  }, [dispatch]);

  const handleApiError = useCallback((error: any, context?: string) => {
    return handleError(error, context);
  }, [handleError]);

  const handleFormError = useCallback((error: any, context?: string) => {
    const processedError = handleError(error, context);
    
    // Return validation errors for form display
    if (processedError && processedError.category === ErrorCategory.USER_INPUT) {
      return {
        message: processedError.message,
        suggestions: processedError.suggestions
      };
    }

    return null;
  }, [handleError]);

  const handleAsyncError = useCallback((asyncFn: (...args: any[]) => Promise<any>, context?: string) => {
    return async (...args: any[]) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error, context);
        throw error; // Re-throw for component-level handling if needed
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    handleFormError,
    handleAsyncError
  };
};

/**
 * Hook for handling RTK Query errors specifically
 */
export const useRTKQueryErrorHandler = () => {
  const { handleApiError } = useErrorHandler();

  const handleRTKError = useCallback((error: any, context?: string) => {
    if (error) {
      return handleApiError(error, context);
    }
    return null;
  }, [handleApiError]);

  return { handleRTKError };
};

/**
 * Hook for retry functionality with error handling
 */
export const useRetryWithErrorHandler = () => {
  const { handleError } = useErrorHandler();

  const retryWithErrorHandler = useCallback(
    async (
      fn: () => Promise<any>,
      maxRetries: number = 3,
      delay: number = 1000,
      context?: string
    ) => {
      let lastError: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error;
          
          const processedError = ErrorService.processError(error);
          
          // Don't retry if error is not retryable
          if (!processedError.retryable) {
            handleError(error, context);
            throw error;
          }

          // Don't retry on last attempt
          if (attempt === maxRetries) {
            break;
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }

      // Handle final error after all retries failed
      handleError(lastError, `${context} (after ${maxRetries} retries)`);
      throw lastError;
    },
    [handleError]
  );

  return { retryWithErrorHandler };
};