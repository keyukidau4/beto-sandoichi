import { useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { addNotification } from '../store/notificationSlice';
import type { RTKQueryError } from '../types';
import { getErrorMessage } from '../types';

/**
 * Custom hook for handling common RTK Query patterns
 */
export const useApiQuery = <T>(queryResult: {
  data?: T;
  error?: RTKQueryError;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) => {
  const dispatch = useAppDispatch();

  const handleError = useCallback((error: RTKQueryError, customMessage?: string) => {
    const message = customMessage || getErrorMessage(error);
    dispatch(addNotification({
      type: 'error',
      message,
    }));
  }, [dispatch]);

  const handleSuccess = useCallback((message: string) => {
    dispatch(addNotification({
      type: 'success',
      message,
    }));
  }, [dispatch]);

  return {
    ...queryResult,
    handleError,
    handleSuccess,
  };
};

/**
 * Custom hook for handling RTK Query mutations with notifications
 */
export const useApiMutation = <TRequest, TResponse>(
  mutationHook: () => [
    (arg: TRequest) => { unwrap: () => Promise<TResponse> },
    { isLoading: boolean; error?: RTKQueryError }
  ]
) => {
  const dispatch = useAppDispatch();
  const [mutate, { isLoading, error }] = mutationHook();

  const executeMutation = useCallback(async (
    data: TRequest,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: TResponse) => void;
      onError?: (error: RTKQueryError) => void;
    }
  ) => {
    try {
      const result = await mutate(data).unwrap();
      
      if (options?.successMessage) {
        dispatch(addNotification({
          type: 'success',
          message: options.successMessage,
        }));
      }
      
      options?.onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      const errorMessage = options?.errorMessage || getErrorMessage(error);
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
      
      options?.onError?.(error as RTKQueryError);
      throw error;
    }
  }, [mutate, dispatch]);

  return {
    executeMutation,
    isLoading,
    error,
  };
};