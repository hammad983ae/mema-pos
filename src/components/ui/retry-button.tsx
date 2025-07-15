import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRetry } from "@/hooks/useRetry";

interface RetryButtonProps {
  onRetry: () => Promise<any>;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  maxAttempts?: number;
  children?: React.ReactNode;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  disabled = false,
  variant = "outline",
  size = "sm",
  maxAttempts = 3,
  children = "Retry"
}) => {
  const { retry, isRetrying, attempts } = useRetry();

  const handleRetry = async () => {
    try {
      await retry(onRetry, { maxAttempts });
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      variant={variant}
      size={size}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
      {isRetrying ? `Retrying... (${attempts}/${maxAttempts})` : children}
    </Button>
  );
};

export default RetryButton;