import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncService } from '@/services/syncService';
import { offlineStorage } from '@/services/offlineStorage';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export const OfflineManager = () => {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadUnsyncedCount = async () => {
    try {
      await offlineStorage.init();
      const transactions = await offlineStorage.getUnsyncedTransactions();
      setUnsyncedCount(transactions.length);
    } catch (error) {
      console.error('Failed to load unsynced count:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncService.syncTransactions();
      setLastSyncTime(new Date().toLocaleTimeString());
      await loadUnsyncedCount();
      
      if (result.success > 0 || result.failed === 0) {
        toast.success('Sync completed successfully');
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnsyncedCount();
    
    // Reload count when coming back online
    if (wasOffline && isOnline) {
      setTimeout(() => {
        loadUnsyncedCount();
        clearWasOffline();
      }, 1000);
    }
  }, [isOnline, wasOffline, clearWasOffline]);

  // Initialize auto-sync
  useEffect(() => {
    syncService.startAutoSync();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Offline Mode Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'Connected' : 'No Internet'}
          </Badge>
        </div>

        {/* Offline Alert */}
        {!isOnline && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Transactions will be stored locally and synced when connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Auto-sync notification */}
        {wasOffline && isOnline && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connection restored! Auto-sync will begin shortly.
            </AlertDescription>
          </Alert>
        )}

        {/* Unsynced Transactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Pending Sync</span>
          </div>
          <Badge variant={unsyncedCount > 0 ? "secondary" : "outline"}>
            {unsyncedCount} transactions
          </Badge>
        </div>

        {/* Manual Sync */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lastSyncTime ? `Last sync: ${lastSyncTime}` : 'No recent sync'}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSync}
            disabled={!isOnline || isLoading || unsyncedCount === 0}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>

        {/* Data Integrity Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-3 w-3" />
            Data integrity checks enabled
          </div>
        </div>
      </CardContent>
    </Card>
  );
};