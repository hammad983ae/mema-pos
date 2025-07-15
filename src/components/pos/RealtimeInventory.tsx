import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface InventoryAlert {
  id: string;
  alert_type: string;
  current_quantity: number;
  threshold_quantity?: number;
  message: string;
  is_resolved: boolean;
  created_at: string;
  products: {
    name: string;
    sku?: string;
  } | null;
}

interface RealtimeInventoryProps {
  storeId: string;
}

export const RealtimeInventory = ({ storeId }: RealtimeInventoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && storeId) {
      fetchAlerts();
      setupRealtimeSubscription();
    }

    return () => {
      // Cleanup subscription when component unmounts
      supabase.removeAllChannels();
    };
  }, [user, storeId]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("inventory_alerts")
        .select(`
          *,
          products (
            name,
            sku
          )
        `)
        .eq("store_id", storeId)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to inventory changes
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Inventory changed:', payload);
          
          // Show toast notification for inventory changes
          if (payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            const oldData = payload.old as any;
            
            if (newData.quantity_on_hand !== oldData.quantity_on_hand) {
              const change = newData.quantity_on_hand - oldData.quantity_on_hand;
              
              toast({
                title: "Inventory Updated",
                description: `Stock ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)} units`,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to new inventory alerts
    const alertsChannel = supabase
      .channel('inventory-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_alerts',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('New alert:', payload);
          
          const newAlert = payload.new as any;
          
          // Add new alert to state
          fetchAlerts(); // Refetch to get product details
          
          // Show toast notification
          toast({
            title: getAlertTitle(newAlert.alert_type),
            description: newAlert.message,
            variant: newAlert.alert_type === 'out_of_stock' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(alertsChannel);
    };
  };

  const getAlertTitle = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return 'Low Stock Alert';
      case 'out_of_stock': return 'Out of Stock Alert';
      case 'reorder_point': return 'Reorder Point Reached';
      case 'overstocked': return 'Overstock Alert';
      default: return 'Inventory Alert';
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'low_stock': return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'out_of_stock': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reorder_point': return <Package className="h-4 w-4 text-yellow-500" />;
      case 'overstocked': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertVariant = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock': return 'destructive' as const;
      case 'low_stock': return 'secondary' as const;
      case 'reorder_point': return 'default' as const;
      case 'overstocked': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!user) return;

    try {
      setResolvingAlerts(prev => new Set([...prev, alertId]));

      const { error } = await supabase
        .from("inventory_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq("id", alertId);

      if (error) throw error;

      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));

      toast({
        title: "Alert Resolved",
        description: "Inventory alert has been marked as resolved",
      });
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading inventory alerts...
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedAlerts = alerts.reduce((acc, alert) => {
    if (!acc[alert.alert_type]) {
      acc[alert.alert_type] = [];
    }
    acc[alert.alert_type].push(alert);
    return acc;
  }, {} as Record<string, InventoryAlert[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Real-time Inventory Alerts
          </CardTitle>
          <CardDescription>
            Live notifications for inventory changes and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h4 className="font-semibold mb-2">All Good!</h4>
              <p className="text-sm text-muted-foreground">
                No active inventory alerts at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Alert Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(groupedAlerts).map(([type, alertList]) => (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {alertList.length}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {type.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Individual Alerts */}
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alert_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {alert.products?.name || 'Unknown Product'}
                          </span>
                          {alert.products?.sku && (
                            <Badge variant="outline" className="text-xs">
                              {alert.products.sku}
                            </Badge>
                          )}
                          <Badge variant={getAlertVariant(alert.alert_type)} className="text-xs">
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Current: {alert.current_quantity} units
                          {alert.threshold_quantity && (
                            <span> • Threshold: {alert.threshold_quantity} units</span>
                          )}
                          {" • "}
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      disabled={resolvingAlerts.has(alert.id)}
                    >
                      {resolvingAlerts.has(alert.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};