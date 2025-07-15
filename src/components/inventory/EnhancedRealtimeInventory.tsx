import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { useRealtimeContext } from "@/components/realtime/RealtimeProvider";
import { supabase } from "@/integrations/supabase/client";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Store,
  Package,
  TrendingDown,
  TrendingUp,
  Zap,
  Users,
  Eye
} from "lucide-react";

interface InventoryItem {
  id: string;
  store_id: string;
  store_name: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_on_hand: number;
  low_stock_threshold: number;
  last_updated: string;
  sync_status: 'synced' | 'pending' | 'error';
  movement_history?: InventoryMovement[];
}

interface InventoryMovement {
  id: string;
  movement_type: string;
  quantity_change: number;
  created_at: string;
  created_by: string;
  reference_type?: string;
}

interface UserActivity {
  user_id: string;
  user_name: string;
  action: string;
  timestamp: string;
  store_id: string;
  product_id: string;
}

export const EnhancedRealtimeInventory = () => {
  const { businessId } = useRealtimeContext();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);

  // Set up real-time subscriptions for inventory updates
  useRealtime(
    businessId ? [
      {
        table: 'inventory',
        onInsert: (payload) => {
          handleInventoryChange('INSERT', payload.new);
        },
        onUpdate: (payload) => {
          handleInventoryChange('UPDATE', payload.new);
        },
        onDelete: (payload) => {
          handleInventoryChange('DELETE', payload.old);
        },
      },
      {
        table: 'inventory_movements',
        onInsert: (payload) => {
          handleMovementChange('INSERT', payload.new);
          trackUserActivity(payload.new);
        },
      },
      {
        table: 'low_stock_alerts',
        onInsert: (payload) => {
          handleLowStockAlert(payload.new);
        },
      },
    ] : [],
    businessId || undefined
  );

  useEffect(() => {
    if (businessId) {
      fetchInventoryData();
    }
  }, [businessId]);

  const fetchInventoryData = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      
      const { data: inventoryData, error } = await supabase
        .from("inventory")
        .select(`
          *,
          stores!inner(id, name, business_id),
          products(id, name, sku)
        `)
        .eq("stores.business_id", businessId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const transformedData: InventoryItem[] = inventoryData?.map(item => ({
        id: item.id,
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
      setSyncErrors(prev => [...prev, `Failed to load inventory: ${error}`]);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInventoryChange = (eventType: string, record: any) => {
    console.log('Real-time inventory change:', eventType, record);
    
    setInventory(prev => {
      const updated = [...prev];
      
      if (eventType === 'INSERT') {
        // Add new inventory item
        const newItem: InventoryItem = {
          id: record.id,
          store_id: record.store_id,
          store_name: 'Loading...', // Will be updated with store info
          product_id: record.product_id,
          product_name: 'Loading...',
          product_sku: 'Loading...',
          quantity_on_hand: record.quantity_on_hand,
          low_stock_threshold: record.low_stock_threshold,
          last_updated: record.updated_at,
          sync_status: 'synced'
        };
        updated.push(newItem);
      } else if (eventType === 'UPDATE') {
        const existingIndex = updated.findIndex(item => item.id === record.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity_on_hand: record.quantity_on_hand,
            low_stock_threshold: record.low_stock_threshold,
            last_updated: record.updated_at,
            sync_status: 'synced'
          };
        }
      } else if (eventType === 'DELETE') {
        return updated.filter(item => item.id !== record.id);
      }
      
      return updated;
    });

    setLastSyncTime(new Date());
    
    // Show sync notification
    toast({
      title: "Inventory Updated",
      description: `Stock levels synced across all stores in real-time`,
    });
  };

  const handleMovementChange = (eventType: string, movement: any) => {
    console.log('Inventory movement detected:', movement);
    
    // Update local inventory based on movement
    setInventory(prev => prev.map(item => {
      if (item.store_id === movement.store_id && item.product_id === movement.product_id) {
        return {
          ...item,
          quantity_on_hand: movement.new_quantity,
          last_updated: movement.created_at,
          sync_status: 'synced'
        };
      }
      return item;
    }));
  };

  const handleLowStockAlert = (alert: any) => {
    const item = inventory.find(i => 
      i.store_id === alert.store_id && i.product_id === alert.product_id
    );
    
    if (item) {
      toast({
        title: "Low Stock Alert!",
        description: `${item.product_name} is running low at ${item.store_name}`,
        variant: "destructive",
      });
    }
  };

  const trackUserActivity = (movement: any) => {
    const activity: UserActivity = {
      user_id: movement.created_by,
      user_name: 'User', // Would fetch from profiles
      action: `${movement.movement_type} - ${movement.quantity_change > 0 ? '+' : ''}${movement.quantity_change}`,
      timestamp: movement.created_at,
      store_id: movement.store_id,
      product_id: movement.product_id
    };

    setActiveUsers(prev => [activity, ...prev.slice(0, 9)]); // Keep last 10 activities
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
  }, {} as Record<string, { storeName: string; items: InventoryItem[] }>);

  const totalProducts = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity_on_hand <= item.low_stock_threshold).length;
  const outOfStockItems = inventory.filter(item => item.quantity_on_hand === 0).length;
  const connectedStores = Object.keys(groupedByStore).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Real-time Inventory
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
      {/* Real-time Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Enhanced Real-time Inventory
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <Button 
              onClick={fetchInventoryData}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{connectedStores}</div>
              <div className="text-sm text-muted-foreground">Stores Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalProducts}</div>
              <div className="text-sm text-muted-foreground">Products Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
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

      {/* Live Activity Feed */}
      {activeUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeUsers.map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm border-l-2 border-l-green-500 pl-2">
                  <span>{activity.user_name} {activity.action}</span>
                  <span className="text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {storeData.items.map((item) => {
                  const stockInfo = getStockStatus(item.quantity_on_hand, item.low_stock_threshold);
                  const stockPercentage = Math.min((item.quantity_on_hand / (item.low_stock_threshold * 2)) * 100, 100);
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
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
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Updated: {new Date(item.last_updated).toLocaleTimeString()}</span>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={item.sync_status === 'synced' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {item.sync_status}
                          </Badge>
                          <Eye className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Log */}
      {syncErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Sync Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {syncErrors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 border-l-2 border-l-red-500 pl-2">
                  {error}
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setSyncErrors([])}
            >
              Clear Errors
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Real-time Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Enhanced real-time sync active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {inventory.filter(i => i.sync_status === 'synced').length} / {inventory.length} items synced
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-4 w-4" />
              Multi-store inventory with live updates
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};