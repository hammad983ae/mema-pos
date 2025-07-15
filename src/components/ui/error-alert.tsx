import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetryButton } from "./retry-button";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => Promise<any>;
  variant?: 'default' | 'destructive';
  showIcon?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = "Error",
  message,
  onDismiss,
  onRetry,
  variant = 'destructive',
  showIcon = true
}) => {
  return (
    <Alert variant={variant} className="relative">
      {showIcon && <AlertTriangle className="h-4 w-4" />}
      
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
      </AlertDescription>
      
      {onRetry && (
        <div className="mt-3">
          <RetryButton onRetry={onRetry} size="sm">
            Try Again
          </RetryButton>
        </div>
      )}
    </Alert>
  );
};

export default ErrorAlert;