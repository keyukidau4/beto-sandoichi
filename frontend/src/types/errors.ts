import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

// Union type for RTK Query errors
export type RTKQueryError = FetchBaseQueryError | SerializedError;

// Type guard to check if error is FetchBaseQueryError
export function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

// Type guard to check if error has data with message
export function hasErrorMessage(error: unknown): error is { data: { message: string } } {
  if (typeof error !== 'object' || error == null || !('data' in error)) {
    return false;
  }
  
  const errorWithData = error as { data: unknown };
  
  return (
    typeof errorWithData.data === 'object' &&
    errorWithData.data != null &&
    'message' in errorWithData.data &&
    typeof (errorWithData.data as { message: unknown }).message === 'string'
  );
}

// Helper function to extract error message safely
export function getErrorMessage(error: RTKQueryError | unknown, fallback = 'エラーが発生しました'): string {
  if (hasErrorMessage(error)) {
    return error.data.message;
  }
  
  if (isFetchBaseQueryError(error)) {
    if (typeof error.data === 'object' && error.data && 'message' in error.data) {
      return (error.data as { message: string }).message;
    }
    return `Error ${error.status}`;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  
  return fallback;
}