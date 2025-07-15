import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeContext } from "./RealtimeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

interface BusinessMetrics {
  totalSales: number;
  activeEmployees: number;
  pendingOrders: number;
  lowStockItems: number;
}

export const RealtimeBusinessLogic = () => {
  const { user } = useAuth();
  const { isConnected, businessId } = useRealtimeContext();
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalSales: 0,
    activeEmployees: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  useEffect(() => {
    if (businessId && isConnected) {
      loadBusinessMetrics();
      setupRealtimeSubscriptions();
    }
  }, [businessId, isConnected]);

  const loadBusinessMetrics = async () => {
    if (!businessId) return;

    try {
      // Load initial metrics
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's sales
      const { data: salesData } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', today);

      const totalSales = salesData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Get active employees (who clocked in today)
      const { data: activeEmployees } = await supabase
        .from('employee_clock_status')
        .select('user_id')
        .eq('is_active', true)
        .gte('clocked_in_at', today);

      // Get pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['pending', 'processing']);

      setMetrics({
        totalSales,
        activeEmployees: activeEmployees?.length || 0,
        pendingOrders: pendingOrders?.length || 0,
        lowStockItems: 0 // Will be updated by inventory alerts
      });

      // Add initial activity
      setRecentActivity([
        "Dashboard loaded successfully",
        `Found ${activeEmployees?.length || 0} active employees`,
        `Today's sales: $${totalSales.toFixed(2)}`
      ]);

    } catch (error) {
      console.error('Error loading business metrics:', error);
      setRecentActivity(prev => [...prev, "Error loading metrics"]);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!businessId) return;

    // Subscribe to orders changes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            setRecentActivity(prev => [
              `New order created: #${newRecord.order_number}`,
              ...prev.slice(0, 4)
            ]);
          } else if (eventType === 'UPDATE' && newRecord.status === 'completed') {
            setMetrics(prev => ({
              ...prev,
              totalSales: prev.totalSales + (newRecord.total || 0)
            }));
            setRecentActivity(prev => [
              `Order completed: #${newRecord.order_number} - $${newRecord.total}`,
              ...prev.slice(0, 4)
            ]);
          }
        }
      )
      .subscribe();

    // Subscribe to employee clock status changes
    const clockChannel = supabase
      .channel('clock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_clock_status',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            if (newRecord.is_active) {
              setMetrics(prev => ({
                ...prev,
                activeEmployees: prev.activeEmployees + (eventType === 'INSERT' ? 1 : 0)
              }));
              setRecentActivity(prev => [
                `Employee clocked in`,
                ...prev.slice(0, 4)
              ]);
            } else {
              setMetrics(prev => ({
                ...prev,
                activeEmployees: Math.max(0, prev.activeEmployees - 1)
              }));
              setRecentActivity(prev => [
                `Employee clocked out`,
                ...prev.slice(0, 4)
              ]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(clockChannel);
    };
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Real-time Business Logic
          </CardTitle>
          <CardDescription>
            Real-time features are currently disconnected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please check your connection to enable real-time business insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Real-time Business Logic
            <Badge variant="outline" className="ml-auto">
              Live
            </Badge>
          </CardTitle>
          <CardDescription>
            Live business metrics and activity monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-xl font-bold">${metrics.totalSales.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-xl font-bold">{metrics.activeEmployees}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-xl font-bold">{metrics.pendingOrders}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold">{metrics.lowStockItems}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                  <span>{activity}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};