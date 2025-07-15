import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  variant?: 'spinner' | 'skeleton' | 'card';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  variant = 'spinner',
  text = 'Loading...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-muted-foreground`} />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};

export default LoadingFallback;