import { useEffect } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { useGetCurrentUserQuery } from '../services/api';
import { loginSuccess, setLoading } from '../store/authSlice';

/**
 * Hook to initialize authentication state on app startup
 * Automatically fetches user data if JWT cookie exists
 */
export function useAuthInitialization() {
  const dispatch = useAppDispatch();
  
  // This query will automatically run and check if user is authenticated
  // based on the JWT cookie sent with the request
  const { 
    data: userResponse, 
    error, 
    isLoading,
    isSuccess,
    isError 
  } = useGetCurrentUserQuery(undefined, {
    // Only run this query once on mount
    refetchOnMountOrArgChange: false,
    // refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    dispatch(setLoading(isLoading));
  }, [dispatch, isLoading]);

  useEffect(() => {
    if (isSuccess && userResponse) {
      // User is authenticated, update Redux state
      dispatch(loginSuccess({
        user: userResponse.user,
        buyerProfile: userResponse.buyerProfile
      }));
    }
  }, [dispatch, isSuccess, userResponse]);

  useEffect(() => {
    if (isError) {
      // User is not authenticated or token is invalid
      // Don't dispatch loginFailure here as it would show error message
      // Just silently fail - user will see login page
      console.log('User not authenticated or token expired');
    }
  }, [dispatch, isError, error]);

  return {
    isInitializing: isLoading,
    isInitialized: isSuccess || isError
  };
}