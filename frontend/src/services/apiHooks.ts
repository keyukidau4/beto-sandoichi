import React, { useCallback } from 'react';
import { useAppDispatch } from '../hooks';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
} from '../store/authSlice';
import { 
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
} from '../store/productSlice';
import { setCurrentOrder, setError as setOrderError } from '../store/orderSlice';
import { addNotification } from '../store/notificationSlice';
import { 
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCreateOrderMutation,
  useGetProductsQuery,
  useTrackProductViewMutation,
} from './api';
import type { LoginRequest, RegisterRequest, CreateOrderRequest, RTKQueryError } from '../types';
import { getErrorMessage } from '../types';

// Enhanced auth hooks with state management
export const useAuthWithState = () => {
  const dispatch = useAppDispatch();
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch(loginStart());
      const result = await loginMutation(credentials).unwrap();
      
      dispatch(loginSuccess(result));
      dispatch(addNotification({
        type: 'success',
        message: 'ログインに成功しました',
      }));
      return result;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'ログインに失敗しました');
      dispatch(loginFailure(errorMessage));
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
      throw error;
    }
  }, [dispatch, loginMutation]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      const result = await registerMutation(userData).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'アカウント登録が完了しました。管理者の承認をお待ちください。',
      }));
      return result;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '登録に失敗しました');
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
      throw error;
    }
  }, [dispatch, registerMutation]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
      dispatch(logoutAction());
      dispatch(addNotification({
        type: 'success',
        message: 'ログアウトしました',
      }));
    } catch (error: unknown) {
      console.log({error});
      
      // Even if logout fails on server, clear local state
      dispatch(logoutAction());
      dispatch(addNotification({
        type: 'info',
        message: 'ログアウトしました',
      }));
    }
  }, [dispatch, logoutMutation]);

  return { login, register, logout };
};

// Enhanced product hooks with state management
export const useProductsWithState = (filters?: { type?: 'banhmi' | 'drink'; searchTerm?: string }) => {
  const dispatch = useAppDispatch();
  const { data, error, isLoading, refetch } = useGetProductsQuery(filters);
  
  // Sync RTK Query data with local state if needed
  React.useEffect(() => {
    if (isLoading) {
      dispatch(fetchProductsStart());
    } else if (error) {
      const errorMessage = getErrorMessage(error, 'Failed to fetch products');
      dispatch(fetchProductsFailure(errorMessage));
    } else if (data?.success) {
      dispatch(fetchProductsSuccess(data.data));
    }
  }, [data, error, isLoading, dispatch]);

  return {
    products: data?.data || [],
    isLoading,
    error: error ? getErrorMessage(error) : undefined,
    refetch,
  };
};

// Enhanced product view tracking
export const useProductView = () => {
  const [trackView] = useTrackProductViewMutation();

  const trackProductView = useCallback(async (productId: string) => {
    try {
      await trackView(productId).unwrap();
    } catch (error) {
      // Silently fail for view tracking
      console.warn('Failed to track product view:', error);
    }
  }, [trackView]);

  return { trackProductView };
};

// Enhanced order creation with state management
export const useOrderWithState = () => {
  const dispatch = useAppDispatch();
  const [createOrderMutation] = useCreateOrderMutation();

  const createOrder = useCallback(async (orderData: CreateOrderRequest) => {
    try {
      dispatch(setOrderError(null));
      const result = await createOrderMutation(orderData).unwrap();
      
      if (result.success) {
        dispatch(setCurrentOrder(result.data));
        
        // Note: Product stock will be updated via cache invalidation in RTK Query
        
        dispatch(addNotification({
          type: 'success',
          message: '注文が正常に作成されました',
        }));
        
        return result;
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '注文の作成に失敗しました');
      dispatch(setOrderError(errorMessage));
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
      throw error;
    }
  }, [dispatch, createOrderMutation]);

  return { createOrder };
};

// Hook for handling API errors globally
export const useApiErrorHandler = () => {
  const dispatch = useAppDispatch();

  const handleApiError = useCallback((error: RTKQueryError, defaultMessage = 'エラーが発生しました') => {
    const errorMessage = getErrorMessage(error, defaultMessage);
    
    // Handle specific error types
    if ('status' in error && typeof error.status === 'number') {
      if (error.status === 401) {
        dispatch(logoutAction());
        dispatch(addNotification({
          type: 'error',
          message: 'セッションが期限切れです。再度ログインしてください。',
        }));
      } else if (error.status === 403) {
        dispatch(addNotification({
          type: 'error',
          message: 'この操作を実行する権限がありません。',
        }));
      } else if (error.status === 404) {
        dispatch(addNotification({
          type: 'error',
          message: '要求されたリソースが見つかりません。',
        }));
      } else if (error.status >= 500) {
        dispatch(addNotification({
          type: 'error',
          message: 'サーバーエラーが発生しました。しばらく後でもう一度お試しください。',
        }));
      } else {
        dispatch(addNotification({
          type: 'error',
          message: errorMessage,
        }));
      }
    } else {
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    }
  }, [dispatch]);

  return { handleApiError };
};