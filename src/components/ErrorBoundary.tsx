import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorFallback } from "./ui/error-fallback";

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<any>;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  reportSent: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      reportSent: false
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Automatically send error report to MemaPOS Support AI
    this.sendErrorReport(error, errorInfo);
  }

  sendErrorReport = async (error: Error, errorInfo: any) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await supabase.from('support_requests').insert({
        error_data: errorData,
        user_message: `Automatic error report: ${error.message}`,
        status: 'auto-reported',
        severity: 'high',
        category: 'system'
      });

      this.setState({ reportSent: true });
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleSupport = () => {
    // Navigate to MemaPOS Support with error context
    const errorContext = btoa(JSON.stringify({
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href
    }));
    window.open(`/memapos-support?error=${errorContext}`, '_blank');
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error}
            resetErrorBoundary={this.handleReload}
          />
        );
      }

      // Use default error fallback
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.handleReload}
          title="Oops! Something went wrong"
          description="We've encountered an unexpected error in MemaPOS. Our AI support system has been notified."
        />
      );
    }

    return this.props.children;
  }
}