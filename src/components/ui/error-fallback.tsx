import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showGoHome?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  description,
  showRetry = true,
  showGoHome = true
}) => {
  const defaultDescription = error?.message || 
    "We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.";

  const handleGoHome = () => {
    // Use window.location instead of useNavigate since this component
    // might be rendered outside the Router context
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {description || defaultDescription}
          </p>

          {error && process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-3 rounded">
              <summary className="cursor-pointer font-medium">
                Technical Details (Development)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {error.stack || error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2 pt-2">
            {showRetry && resetErrorBoundary && (
              <Button 
                onClick={resetErrorBoundary} 
                variant="outline" 
                className="flex-1"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {showGoHome && (
              <Button 
                onClick={handleGoHome} 
                className="flex-1"
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorFallback;