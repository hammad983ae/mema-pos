import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Store, 
  Package,
  TrendingDown,
  TrendingUp
} from "lucide-react";

interface StoreInventory {
  store_id: string;
  store_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_on_hand: number;
  low_stock_threshold: number;
  last_updated: string;
  sync_status: 'synced' | 'pending' | 'error';
}

interface RealtimeStockSyncProps {
  storeId: string;
}

export const RealtimeStockSync = ({ storeId }: RealtimeStockSyncProps) => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchInventoryData();
    setupRealtimeSubscription();
  }, [storeId]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      const { data: inventoryData, error } = await supabase
        .from("inventory")
        .select(`
          store_id,
          product_id,
          quantity_on_hand,
          low_stock_threshold,
          updated_at,
          stores(name),
          products(name, sku)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const transformedData: StoreInventory[] = inventoryData?.map(item => ({
        store_id: item.store_id,
        store_name: item.stores?.name || 'Unknown Store',
        product_id: item.product_id,
        product_name: item.products?.name || 'Unknown Product',
        product_sku: item.products?.sku || 'N/A',
        quantity_on_hand: item.quantity_on_hand,
        low_stock_threshold: item.low_stock_threshold,
        last_updated: item.updated_at,
        sync_status: 'synced'
      })) || [];

      setInventory(transformedData);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('inventory-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          handleInventoryChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_movements'
        },
        (payload) => {
          console.log('Inventory movement detected:', payload);
          // Refresh inventory when movements occur
          fetchInventoryData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleInventoryChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setInventory(prev => {
      const updated = [...prev];
      
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const existingIndex = updated.findIndex(
          item => item.store_id === newRecord.store_id && 
                   item.product_id === newRecord.product_id
        );

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity_on_hand: newRecord.quantity_on_hand,
            last_updated: newRecord.updated_at,
            sync_status: 'synced'
          };
        }
      } else if (eventType === 'DELETE' && oldRecord) {
        const index = updated.findIndex(
          item => item.store_id === oldRecord.store_id && 
                   item.product_id === oldRecord.product_id
        );
        if (index >= 0) {
          updated.splice(index, 1);
        }
      }

      return updated;
    });

    setLastSyncTime(new Date());
    
    toast({
      title: "Stock Updated",
      description: `Inventory synced across stores in real-time`,
    });
  };

  const syncAllStores = async () => {
    setSyncInProgress(true);
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchInventoryData();
      
      toast({
        title: "Sync Complete",
        description: "All store inventories have been synchronized",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize store inventories",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'out', color: 'destructive', icon: AlertTriangle };
    if (quantity <= threshold) return { status: 'low', color: 'warning', icon: TrendingDown };
    return { status: 'good', color: 'success', icon: CheckCircle };
  };

  const groupedByStore = inventory.reduce((acc, item) => {
    if (!acc[item.store_id]) {
      acc[item.store_id] = {
        storeName: item.store_name,
        items: []
      };
    }
    acc[item.store_id].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: StoreInventory[] }>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Real-time Stock Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading inventory data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Real-time Stock Sync
            </div>
            <Button 
              onClick={syncAllStores}
              disabled={syncInProgress}
              size="sm"
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Sync
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(groupedByStore).length}
              </div>
              <div className="text-sm text-muted-foreground">Stores Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {inventory.length}
              </div>
              <div className="text-sm text-muted-foreground">Products Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {inventory.filter(item => item.quantity_on_hand <= item.low_stock_threshold).length}
              </div>
              <div className="text-sm text-muted-foreground">Low Stock Items</div>
            </div>
          </div>
          
          {lastSyncTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedByStore).map(([storeId, storeData]) => (
          <Card key={storeId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="h-5 w-5" />
                {storeData.storeName}
                <Badge variant="outline" className="ml-auto">
                  {storeData.items.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {storeData.items.map((item) => {
                  const stockInfo = getStockStatus(item.quantity_on_hand, item.low_stock_threshold);
                  const stockPercentage = Math.min((item.quantity_on_hand / (item.low_stock_threshold * 2)) * 100, 100);
                  
                  return (
                    <div key={`${item.store_id}-${item.product_id}`} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.product_sku}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <stockInfo.icon className={`h-4 w-4 ${
                            stockInfo.color === 'destructive' ? 'text-red-500' :
                            stockInfo.color === 'warning' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          <Badge variant="outline" className="text-xs">
                            {item.quantity_on_hand}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Stock Level</span>
                          <span>Threshold: {item.low_stock_threshold}</span>
                        </div>
                        <Progress 
                          value={stockPercentage} 
                          className={`h-2 ${
                            stockInfo.color === 'destructive' ? 'bg-red-100' :
                            stockInfo.color === 'warning' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Updated: {new Date(item.last_updated).toLocaleTimeString()}</span>
                        <Badge 
                          variant={item.sync_status === 'synced' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {item.sync_status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Status Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Real-time sync active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {inventory.filter(i => i.sync_status === 'synced').length} / {inventory.length} items synced
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-4 w-4" />
              Multi-store inventory tracking enabled
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};