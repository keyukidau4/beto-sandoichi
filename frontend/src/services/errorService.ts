import type { RTKQueryError } from '../types/errors';

// Error codes that match backend error types
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// User-friendly error messages in Japanese (for future use)
// const errorMessages: Record<ErrorCode, string> = {
//   [ErrorCodes.VALIDATION_ERROR]: '入力内容に問題があります。',
//   [ErrorCodes.AUTHENTICATION_ERROR]: 'ログインが必要です。',
//   [ErrorCodes.AUTHORIZATION_ERROR]: 'この操作を実行する権限がありません。',
//   [ErrorCodes.NOT_FOUND_ERROR]: '要求されたデータが見つかりません。',
//   [ErrorCodes.DUPLICATE_ERROR]: '既に存在するデータです。',
//   [ErrorCodes.INSUFFICIENT_STOCK]: '在庫が不足しています。',
//   [ErrorCodes.INSUFFICIENT_POINTS]: 'ポイントが不足しています。',
//   [ErrorCodes.PAYMENT_ERROR]: '支払い処理でエラーが発生しました。',
//   [ErrorCodes.UPLOAD_ERROR]: 'ファイルのアップロードに失敗しました。',
//   [ErrorCodes.DATABASE_ERROR]: 'データベースエラーが発生しました。',
//   [ErrorCodes.EXTERNAL_SERVICE_ERROR]: '外部サービスが利用できません。',
//   [ErrorCodes.INTERNAL_SERVER_ERROR]: 'サーバーエラーが発生しました。',
//   [ErrorCodes.NETWORK_ERROR]: 'ネットワークエラーが発生しました。',
//   [ErrorCodes.TIMEOUT_ERROR]: 'リクエストがタイムアウトしました。'
// };

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

// Error category for better handling
export const ErrorCategory = {
  USER_INPUT: 'user_input',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  BUSINESS_LOGIC: 'business_logic',
  SYSTEM: 'system',
  NETWORK: 'network'
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

export interface ProcessedError {
  message: string;
  code: ErrorCode;
  severity: ErrorSeverity;
  category: ErrorCategory;
  originalError: any;
  suggestions?: string[];
  retryable: boolean;
}

/**
 * Error service for processing and categorizing errors
 */
export class ErrorService {
  /**
   * Process an error and return structured error information
   */
  static processError(error: any): ProcessedError {
    // Handle RTK Query errors
    if (this.isRTKQueryError(error)) {
      return this.processRTKQueryError(error);
    }

    // Handle JavaScript errors
    if (error instanceof Error) {
      return this.processJavaScriptError(error);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.processStringError(error);
    }

    // Handle unknown errors
    return this.processUnknownError(error);
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    const processed = this.processError(error);
    return processed.message;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: any): boolean {
    const processed = this.processError(error);
    return processed.retryable;
  }

  /**
   * Get error suggestions for user
   */
  static getErrorSuggestions(error: any): string[] {
    const processed = this.processError(error);
    return processed.suggestions || [];
  }

  /**
   * Check if error is RTK Query error
   */
  private static isRTKQueryError(error: any): error is RTKQueryError {
    return error && (
      'status' in error ||
      'error' in error ||
      'data' in error
    );
  }

  /**
   * Process RTK Query errors
   */
  private static processRTKQueryError(error: RTKQueryError): ProcessedError {
    // Handle fetch errors
    if ('status' in error) {
      if (error.status === 'FETCH_ERROR') {
        return {
          message: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
          code: ErrorCodes.NETWORK_ERROR,
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.NETWORK,
          originalError: error,
          suggestions: [
            'インターネット接続を確認してください',
            'しばらく待ってから再試行してください',
            'ページを再読み込みしてください'
          ],
          retryable: true
        };
      }

      if (error.status === 'TIMEOUT_ERROR') {
        return {
          message: 'リクエストがタイムアウトしました。',
          code: ErrorCodes.TIMEOUT_ERROR,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.NETWORK,
          originalError: error,
          suggestions: [
            'しばらく待ってから再試行してください',
            'インターネット接続を確認してください'
          ],
          retryable: true
        };
      }

      // Handle HTTP status codes
      if (typeof error.status === 'number') {
        return this.processHttpError(error.status, error);
      }
    }

    // Handle serialized errors
    if ('message' in error) {
      return {
        message: error.message || 'エラーが発生しました',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SYSTEM,
        originalError: error,
        retryable: false
      };
    }

    return this.processUnknownError(error);
  }

  /**
   * Process HTTP status code errors
   */
  private static processHttpError(status: number, error: any): ProcessedError {
    const errorData = error.data || {};
    const backendMessage = errorData.message;
    const errorCode = errorData.code;

    switch (status) {
      case 400:
        return {
          message: backendMessage || '入力内容に問題があります。',
          code: errorCode || ErrorCodes.VALIDATION_ERROR,
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.USER_INPUT,
          originalError: error,
          suggestions: [
            '入力内容を確認してください',
            '必須項目が入力されているか確認してください'
          ],
          retryable: false
        };

      case 401:
        return {
          message: backendMessage || 'ログインが必要です。',
          code: errorCode || ErrorCodes.AUTHENTICATION_ERROR,
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.AUTHENTICATION,
          originalError: error,
          suggestions: [
            'ログインしてください',
            'セッションが切れている可能性があります'
          ],
          retryable: false
        };

      case 403:
        return {
          message: backendMessage || 'この操作を実行する権限がありません。',
          code: errorCode || ErrorCodes.AUTHORIZATION_ERROR,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.AUTHORIZATION,
          originalError: error,
          suggestions: [
            '管理者に権限を確認してください',
            'アカウントの承認状況を確認してください'
          ],
          retryable: false
        };

      case 404:
        return {
          message: backendMessage || '要求されたデータが見つかりません。',
          code: errorCode || ErrorCodes.NOT_FOUND_ERROR,
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.BUSINESS_LOGIC,
          originalError: error,
          suggestions: [
            'URLを確認してください',
            'データが削除されている可能性があります'
          ],
          retryable: false
        };

      case 409:
        return {
          message: backendMessage || '既に存在するデータです。',
          code: errorCode || ErrorCodes.DUPLICATE_ERROR,
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.BUSINESS_LOGIC,
          originalError: error,
          suggestions: [
            '別の値を入力してください',
            '既存のデータを確認してください'
          ],
          retryable: false
        };

      case 429:
        return {
          message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
          code: ErrorCodes.VALIDATION_ERROR,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.SYSTEM,
          originalError: error,
          suggestions: [
            'しばらく待ってから再試行してください',
            '操作の頻度を下げてください'
          ],
          retryable: true
        };

      case 500:
        return {
          message: backendMessage || 'サーバーエラーが発生しました。',
          code: errorCode || ErrorCodes.INTERNAL_SERVER_ERROR,
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.SYSTEM,
          originalError: error,
          suggestions: [
            'しばらく待ってから再試行してください',
            '管理者に問い合わせてください'
          ],
          retryable: true
        };

      case 503:
        return {
          message: 'サービスが一時的に利用できません。',
          code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.SYSTEM,
          originalError: error,
          suggestions: [
            'しばらく待ってから再試行してください',
            'メンテナンス情報を確認してください'
          ],
          retryable: true
        };

      default:
        return {
          message: backendMessage || `エラーが発生しました (${status})`,
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          severity: ErrorSeverity.MEDIUM,
          category: ErrorCategory.SYSTEM,
          originalError: error,
          retryable: status >= 500
        };
    }
  }

  /**
   * Process JavaScript errors
   */
  private static processJavaScriptError(error: Error): ProcessedError {
    return {
      message: 'アプリケーションエラーが発生しました。',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      originalError: error,
      suggestions: [
        'ページを再読み込みしてください',
        'ブラウザのキャッシュをクリアしてください'
      ],
      retryable: false
    };
  }

  /**
   * Process string errors
   */
  private static processStringError(error: string): ProcessedError {
    return {
      message: error,
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SYSTEM,
      originalError: error,
      retryable: false
    };
  }

  /**
   * Process unknown errors
   */
  private static processUnknownError(error: any): ProcessedError {
    return {
      message: '予期しないエラーが発生しました。',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      originalError: error,
      suggestions: [
        'ページを再読み込みしてください',
        '管理者に問い合わせてください'
      ],
      retryable: false
    };
  }

  /**
   * Log error for debugging (in development) or monitoring (in production)
   */
  static logError(error: ProcessedError, context?: string): void {
    const logData = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      category: error.category,
      context,
      timestamp: new Date().toISOString(),
      originalError: error.originalError
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', logData);
    } else {
      // In production, you might want to send this to an error monitoring service
      // Example: errorMonitoringService.log(logData);
    }
  }
}