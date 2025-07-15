import { useCallback, useState } from 'react';
import { useToast } from './use-toast';

interface ErrorDetails {
  message: string;
  code?: string;
  context?: string;
  retry?: () => void;
  retryCount?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number) => void;
}

export function useErrorHandler() {
  const { toast } = useToast();
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(new Map());

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleError = useCallback((error: any, context?: string, retryFn?: () => Promise<any>) => {
    // Only log in development

    let errorMessage = 'An unexpected error occurred';
    let shouldRetry = false;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'Network connection error. Please check your internet connection.';
      shouldRetry = true;
      severity = 'high';
    }
    // Authentication errors
    else if (error.status === 401 || error.message?.includes('auth') || error.message?.includes('JWT')) {
      errorMessage = 'Authentication required. Please log in again.';
      severity = 'critical';
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    }
    // Permission errors
    else if (error.status === 403) {
      errorMessage = 'You do not have permission to perform this action.';
      severity = 'high';
    }
    // Not found errors
    else if (error.status === 404) {
      errorMessage = 'The requested resource was not found.';
      severity = 'medium';
    }
    // Conflict errors
    else if (error.status === 409) {
      errorMessage = 'This action conflicts with existing data.';
      severity = 'medium';
    }
    // Server errors
    else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
      shouldRetry = true;
      severity = 'high';
    }
    // Timeout errors
    else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      shouldRetry = true;
      severity = 'medium';
    }
    // Supabase specific errors
    else if (error.code) {
      switch (error.code) {
        case '23505':
          errorMessage = 'This record already exists.';
          severity = 'low';
          break;
        case '23503':
          errorMessage = 'Cannot delete this record as it is being used elsewhere.';
          severity = 'medium';
          break;
        case 'PGRST301':
          errorMessage = 'No data found matching your request.';
          severity = 'low';
          break;
        case 'PGRST116':
          errorMessage = 'Too many results. Please refine your search.';
          severity = 'low';
          break;
        case '42501':
          errorMessage = 'Insufficient permissions to access this resource.';
          severity = 'high';
          break;
        default:
          errorMessage = error.message || errorMessage;
          severity = 'medium';
      }
    }
    // Custom error messages
    else if (error.message) {
      errorMessage = error.message;
      severity = 'medium';
    }

    const contextKey = context || 'default';
    const currentRetries = retryAttempts.get(contextKey) || 0;

    const errorDetails: ErrorDetails = {
      message: errorMessage,
      code: error.code,
      context: context,
      retryCount: currentRetries,
      severity,
      retry: shouldRetry && retryFn && currentRetries < 3 ? () => {
        setRetryAttempts(prev => new Map(prev).set(contextKey, currentRetries + 1));
        retryFn();
      } : undefined
    };

    // Log to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context || 'application'}:`, error);
    }
    
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service (Sentry, LogRocket, etc.)
      // This would be implemented when setting up error monitoring
    }

    toast({
      title: severity === 'critical' ? "Critical Error" : severity === 'high' ? "Error" : "Warning",
      description: errorMessage,
      variant: "destructive",
    });

    return errorDetails;
  }, [toast, retryAttempts]);

  const withErrorHandling = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      context?: string,
      options?: RetryOptions
    ) => {
      return async (...args: T): Promise<R | null> => {
        const { maxRetries = 3, delay = 1000, exponentialBackoff = true, onRetry } = options || {};
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const result = await fn(...args);
            // Reset retry count on success
            const contextKey = context || 'default';
            setRetryAttempts(prev => {
              const newMap = new Map(prev);
              newMap.delete(contextKey);
              return newMap;
            });
            return result;
          } catch (error) {
            if (attempt === maxRetries) {
              handleError(error, context);
              return null;
            }

            // Check if error is retryable
            const shouldRetry = 
              error.name === 'NetworkError' || 
              error.message?.includes('fetch') || 
              error.status >= 500 ||
              error.name === 'TimeoutError';

            if (!shouldRetry) {
              handleError(error, context);
              return null;
            }

            // Wait before retry
            const waitTime = exponentialBackoff 
              ? delay * Math.pow(2, attempt) 
              : delay;
            
            await sleep(waitTime);
            onRetry?.(attempt + 1);
          }
        }
        return null;
      };
    },
    [handleError]
  );

  const withRetry = useCallback(
    async function<T>(
      fn: () => Promise<T>,
      options?: RetryOptions
    ): Promise<T | null> {
      const { maxRetries = 3, delay = 1000, exponentialBackoff = true, onRetry } = options || {};
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          if (attempt === maxRetries) {
            throw error;
          }

          const waitTime = exponentialBackoff 
            ? delay * Math.pow(2, attempt) 
            : delay;
          
          await sleep(waitTime);
          onRetry?.(attempt + 1);
        }
      }
      return null;
    },
    []
  );

  const clearRetryAttempts = useCallback((context?: string) => {
    if (context) {
      setRetryAttempts(prev => {
        const newMap = new Map(prev);
        newMap.delete(context);
        return newMap;
      });
    } else {
      setRetryAttempts(new Map());
    }
  }, []);

  return {
    handleError,
    withErrorHandling,
    withRetry,
    clearRetryAttempts,
    retryAttempts
  };
}