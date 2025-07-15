import React, { createContext, useContext, ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { OfflineIndicator } from '../ui/offline-indicator';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface ErrorContextType {
  handleError: (error: any, context?: string, retryFn?: () => Promise<any>) => any;
  withErrorHandling: any;
  withRetry: any;
  clearRetryAttempts: (context?: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  fallback 
}) => {
  const errorHandler = useErrorHandler();

  const handleGlobalError = (error: Error, errorInfo: any) => {
    console.error('Global error caught by ErrorBoundary:', error, errorInfo);
    
    // Log to external service if needed
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Production error boundary:', { error, errorInfo });
    }
  };

  return (
    <ErrorContext.Provider value={errorHandler}>
      <ErrorBoundary fallback={fallback} onError={handleGlobalError}>
        <OfflineIndicator />
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorProvider;