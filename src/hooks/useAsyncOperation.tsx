import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isSuccess: boolean;
}

interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  retryOptions?: {
    maxRetries?: number;
    delay?: number;
    exponentialBackoff?: boolean;
  };
}

export function useAsyncOperation<T = any>(
  operation: () => Promise<T>,
  options?: AsyncOperationOptions
) {
  const { withErrorHandling } = useErrorHandler();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    isSuccess: false
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, isSuccess: false }));

    try {
      const wrappedOperation = withErrorHandling(
        operation,
        'async-operation',
        options?.retryOptions
      );
      
      const result = await wrappedOperation();
      
      if (result !== null) {
        setState({
          data: result,
          loading: false,
          error: null,
          isSuccess: true
        });
        options?.onSuccess?.(result);
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Operation failed',
          isSuccess: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An unexpected error occurred',
        isSuccess: false
      }));
      options?.onError?.(error);
    }
  }, [operation, withErrorHandling, options]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      isSuccess: false
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

export default useAsyncOperation;