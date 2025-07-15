import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="fixed top-4 left-4 right-4 z-50 bg-destructive text-destructive-foreground border-destructive">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're currently offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
};

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isOnline ? (
        <Wifi className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-destructive" />
      )}
      <span>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

export default OfflineIndicator;