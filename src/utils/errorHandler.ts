/**
 * Standardized error handling utilities for the Mema platform
 */

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export class MemaError extends Error implements AppError {
  public code?: string;
  public statusCode?: number;
  public context?: Record<string, any>;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'MemaError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }
}

export const ErrorCodes = {
  // Authentication Errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Business Logic Errors
  BUSINESS_NOT_FOUND: 'BUSINESS_NOT_FOUND',
  INVALID_BUSINESS_DATA: 'INVALID_BUSINESS_DATA',
  
  // Database Errors
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  
  // API Errors
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Payment Errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  
  // General Errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Format error messages for user display
 */
export const formatErrorMessage = (error: Error | AppError): string => {
  if (error instanceof MemaError) {
    switch (error.code) {
      case ErrorCodes.AUTH_FAILED:
        return 'Authentication failed. Please check your credentials.';
      case ErrorCodes.PERMISSION_DENIED:
        return 'You do not have permission to perform this action.';
      case ErrorCodes.BUSINESS_NOT_FOUND:
        return 'Business not found. Please contact support.';
      case ErrorCodes.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case ErrorCodes.PAYMENT_FAILED:
        return 'Payment processing failed. Please try again or contact support.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  return error.message || 'An unexpected error occurred.';
};

/**
 * Log errors for debugging and monitoring
 */
export const logError = (error: Error | AppError, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
  
  // In production, this would send to error monitoring service
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Handle and format Supabase errors
 */
export const handleSupabaseError = (error: any): MemaError => {
  if (!error) {
    return new MemaError('Unknown database error', ErrorCodes.DB_QUERY_ERROR);
  }

  // Handle specific Supabase error codes
  switch (error.code) {
    case 'PGRST301':
      return new MemaError(
        'Resource not found',
        ErrorCodes.DB_QUERY_ERROR,
        404,
        { originalError: error }
      );
    case 'PGRST116':
      return new MemaError(
        'Invalid query parameters',
        ErrorCodes.VALIDATION_ERROR,
        400,
        { originalError: error }
      );
    case '42501':
      return new MemaError(
        'Insufficient permissions',
        ErrorCodes.PERMISSION_DENIED,
        403,
        { originalError: error }
      );
    default:
      return new MemaError(
        error.message || 'Database operation failed',
        ErrorCodes.DB_QUERY_ERROR,
        500,
        { originalError: error }
      );
  }
};

/**
 * Create a standardized error response for API calls
 */
export const createErrorResponse = (error: Error | AppError) => {
  const formattedError = error instanceof MemaError ? error : new MemaError(error.message, ErrorCodes.UNKNOWN_ERROR);
  
  return {
    success: false,
    error: {
      message: formatErrorMessage(formattedError),
      code: formattedError.code,
      ...(process.env.NODE_ENV === 'development' && { stack: formattedError.stack })
    }
  };
};

/**
 * Async error wrapper for better error handling
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<{ data?: R; error?: MemaError }> => {
    try {
      const data = await fn(...args);
      return { data };
    } catch (error) {
      const appError = error instanceof MemaError 
        ? error 
        : new MemaError(
            error instanceof Error ? error.message : 'Unknown error',
            ErrorCodes.UNKNOWN_ERROR
          );
      
      logError(appError);
      return { error: appError };
    }
  };
};