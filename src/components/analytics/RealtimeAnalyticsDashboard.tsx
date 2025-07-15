import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Bell, 
  Target,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface SalesMetrics {
  todaySales: number;
  todayTransactions: number;
  averageTicket: number;
  topEmployee: string;
  hourlyTrend: number[];
  recentTransactions: any[];
  alertsCount: number;
}

export const RealtimeAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SalesMetrics>({
    todaySales: 0,
    todayTransactions: 0,
    averageTicket: 0,
    topEmployee: '',
    hourlyTrend: [],
    recentTransactions: [],
    alertsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>('');

  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscription();
  }, [user]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      // Get user's business context
      const { data: userContext } = await supabase.rpc('get_user_business_context');
      if (!userContext?.[0]) return;

      const businessId = userContext[0].business_id;
      setBusinessId(businessId);

      // Load today's metrics
      const today = new Date().toISOString().split('T')[0];
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          total,
          created_at,
          profiles!inner(full_name),
          stores!inner(business_id)
        `)
        .eq('stores.business_id', businessId)
        .gte('created_at', today)
        .eq('status', 'completed');

      if (ordersData) {
        const totalSales = ordersData.reduce((sum, order) => sum + order.total, 0);
        const transactionCount = ordersData.length;
        const averageTicket = transactionCount > 0 ? totalSales / transactionCount : 0;

        // Calculate hourly trend (last 6 hours)
        const now = new Date();
        const hourlyTrend = Array.from({ length: 6 }, (_, i) => {
          const hour = new Date(now.getTime() - (5 - i) * 60 * 60 * 1000);
          const hourStart = hour.toISOString().split('T')[0] + 'T' + hour.getHours().toString().padStart(2, '0') + ':00:00';
          const hourEnd = hour.toISOString().split('T')[0] + 'T' + (hour.getHours() + 1).toString().padStart(2, '0') + ':00:00';
          
          return ordersData.filter(order => 
            order.created_at >= hourStart && order.created_at < hourEnd
          ).reduce((sum, order) => sum + order.total, 0);
        });

        setMetrics({
          todaySales: totalSales,
          todayTransactions: transactionCount,
          averageTicket,
          topEmployee: 'Loading...',
          hourlyTrend,
          recentTransactions: ordersData.slice(-5).reverse(),
          alertsCount: 0
        });
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!businessId) return;

    // Subscribe to real-time order updates
    const ordersSubscription = supabase
      .channel('orders-analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `status=eq.completed`
        },
        (payload) => {
          handleNewOrder(payload.new);
        }
      )
      .subscribe();

    // Subscribe to manager approval requests
    const approvalsSubscription = supabase
      .channel('manager-approvals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'manager_approval_requests'
        },
        (payload) => {
          handleApprovalRequest(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(approvalsSubscription);
    };
  };

  const handleNewOrder = (newOrder: any) => {
    // Update metrics in real-time
    setMetrics(prev => ({
      ...prev,
      todaySales: prev.todaySales + newOrder.total,
      todayTransactions: prev.todayTransactions + 1,
      averageTicket: (prev.todaySales + newOrder.total) / (prev.todayTransactions + 1)
    }));

    // Show notification for large sales
    if (newOrder.total > 500) {
      toast.success(`🎉 Large sale alert: $${newOrder.total.toFixed(2)}!`, {
        duration: 5000
      });
    }
  };

  const handleApprovalRequest = (request: any) => {
    setMetrics(prev => ({
      ...prev,
      alertsCount: prev.alertsCount + 1
    }));

    toast.error(`Manager approval needed for $${request.amount.toFixed(2)} transaction`, {
      duration: 10000,
      action: {
        label: 'Review',
        onClick: () => {
          // Navigate to approval screen
          window.location.href = '/manager/approvals';
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">${metrics.todaySales.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{metrics.todayTransactions}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Ticket</p>
                <p className="text-2xl font-bold">${metrics.averageTicket.toFixed(2)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Alerts</p>
                <p className="text-2xl font-bold">{metrics.alertsCount}</p>
              </div>
              <div className="relative">
                <Bell className="h-8 w-8 text-orange-600" />
                {metrics.alertsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {metrics.alertsCount}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Trend (Last 6 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-2">
            {metrics.hourlyTrend.map((value, index) => {
              const maxValue = Math.max(...metrics.hourlyTrend);
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-primary rounded-t w-full min-h-[4px] transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">
                    {new Date(Date.now() - (5 - index) * 60 * 60 * 1000).getHours()}h
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No transactions today</p>
            ) : (
              metrics.recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <div>
                      <p className="font-medium">${transaction.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {transaction.profiles?.full_name || 'Unknown'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/manager/approvals'}
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          View Approval Requests
          {metrics.alertsCount > 0 && (
            <Badge className="ml-2">{metrics.alertsCount}</Badge>
          )}
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => loadInitialData()}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};