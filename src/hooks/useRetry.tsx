import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  exponentialBackoff?: boolean;
}

export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const retry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T> => {
      const { maxAttempts = 3, delay = 1000, exponentialBackoff = true } = options;
      
      setIsRetrying(true);
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setAttempts(attempt);
          const result = await operation();
          setIsRetrying(false);
          setAttempts(0);
          return result;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt === maxAttempts) {
            setIsRetrying(false);
            setAttempts(0);
            throw lastError;
          }

          // Calculate delay with optional exponential backoff
          const waitTime = exponentialBackoff 
            ? delay * Math.pow(2, attempt - 1)
            : delay;
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      setIsRetrying(false);
      setAttempts(0);
      throw lastError!;
    },
    []
  );

  return {
    retry,
    isRetrying,
    attempts,
  };
}