import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { useRealtimeContext } from "@/components/realtime/RealtimeProvider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Zap, 
  Bell, 
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Award,
  Calendar
} from "lucide-react";

interface BusinessEvent {
  id: string;
  type: 'sale' | 'goal_achieved' | 'low_stock' | 'schedule_change' | 'commission' | 'approval_needed';
  title: string;
  description: string;
  data: any;
  user_id?: string;
  store_id?: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  auto_resolved: boolean;
}

interface RealtimeMetrics {
  total_sales_today: number;
  active_employees: number;
  pending_approvals: number;
  low_stock_alerts: number;
  commission_pending: number;
  goals_achieved: number;
}

interface CommissionUpdate {
  user_id: string;
  user_name: string;
  amount: number;
  sale_amount: number;
  commission_rate: number;
  created_at: string;
}

export const RealtimeBusinessLogic = () => {
  const { businessId } = useRealtimeContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    total_sales_today: 0,
    active_employees: 0,
    pending_approvals: 0,
    low_stock_alerts: 0,
    commission_pending: 0,
    goals_achieved: 0,
  });
  const [recentCommissions, setRecentCommissions] = useState<CommissionUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up comprehensive real-time subscriptions
  useRealtime(
    businessId ? [
      {
        table: 'orders',
        onInsert: (payload) => {
          handleNewSale(payload.new);
        },
        onUpdate: (payload) => {
          handleSaleUpdate(payload.new, payload.old);
        },
      },
      {
        table: 'commission_payments',
        onInsert: (payload) => {
          handleNewCommission(payload.new);
        },
      },
      {
        table: 'sales_goals',
        onUpdate: (payload) => {
          handleGoalUpdate(payload.new, payload.old);
        },
      },
      {
        table: 'low_stock_alerts',
        onInsert: (payload) => {
          handleLowStockAlert(payload.new);
        },
      },
      {
        table: 'pending_announcements',
        onInsert: (payload) => {
          handlePendingAnnouncement(payload.new);
        },
      },
      {
        table: 'user_presence',
        onInsert: (payload) => {
          handleUserPresenceUpdate(payload.new);
        },
        onUpdate: (payload) => {
          handleUserPresenceUpdate(payload.new);
        },
      },
    ] : [],
    businessId || undefined
  );

  useEffect(() => {
    if (businessId) {
      initializeBusinessLogic();
    }
  }, [businessId]);

  const initializeBusinessLogic = async () => {
    if (!businessId) return;
    
    try {
      setLoading(true);
      await Promise.all([
        fetchTodaysMetrics(),
        fetchRecentEvents(),
        fetchRecentCommissions(),
      ]);
    } catch (error) {
      console.error("Error initializing business logic:", error);
      toast({
        title: "Error",
        description: "Failed to load business data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysMetrics = async () => {
    if (!businessId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's sales
      const { data: salesData } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      const totalSales = salesData?.reduce((sum, order) => sum + order.total, 0) || 0;

      // Fetch active employees (online in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('user_id')
        .eq('business_id', businessId)
        .gte('last_seen', thirtyMinutesAgo.toISOString())
        .eq('status', 'online');

      // Fetch pending approvals
      const { data: approvalsData } = await supabase
        .from('pending_announcements')
        .select('id')
        .eq('business_id', businessId)
        .is('approved_at', null);

      // Fetch low stock alerts
      const { data: stockAlertsData } = await supabase
        .from('low_stock_alerts')
        .select('id')
        .eq('is_resolved', false);

      // Fetch pending commissions
      const { data: commissionsData } = await supabase
        .from('commission_payments')
        .select('commission_amount')
        .eq('business_id', businessId)
        .eq('is_paid', false);

      const pendingCommissions = commissionsData?.reduce((sum, comm) => sum + comm.commission_amount, 0) || 0;

      setMetrics({
        total_sales_today: totalSales,
        active_employees: presenceData?.length || 0,
        pending_approvals: approvalsData?.length || 0,
        low_stock_alerts: stockAlertsData?.length || 0,
        commission_pending: pendingCommissions,
        goals_achieved: 0, // Will be calculated from goals
      });

    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const fetchRecentEvents = async () => {
    // For now, we'll start with an empty array
    // In a real implementation, you'd fetch from a business_events table
    setEvents([]);
  };

  const fetchRecentCommissions = async () => {
    if (!businessId) return;

    try {
      const { data: commissionsData } = await supabase
        .from('commission_payments')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!commissionsData) {
        setRecentCommissions([]);
        return;
      }

      // Fetch user profiles separately
      const userIds = [...new Set(commissionsData.map(comm => comm.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const commissions: CommissionUpdate[] = commissionsData.map(comm => ({
        user_id: comm.user_id,
        user_name: profilesMap.get(comm.user_id)?.full_name || 'Unknown User',
        amount: comm.commission_amount,
        sale_amount: comm.sale_amount,
        commission_rate: comm.commission_rate,
        created_at: comm.created_at,
      }));

      setRecentCommissions(commissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    }
  };

  const handleNewSale = async (order: any) => {
    console.log('New sale detected:', order);
    
    // Update metrics
    setMetrics(prev => ({
      ...prev,
      total_sales_today: prev.total_sales_today + (order.total || 0),
    }));

    // Create business event
    const event: BusinessEvent = {
      id: `sale_${order.id}`,
      type: 'sale',
      title: 'New Sale Completed',
      description: `$${order.total} sale completed${order.user_id ? ' by team member' : ''}`,
      data: order,
      user_id: order.user_id,
      store_id: order.store_id,
      created_at: order.created_at,
      priority: order.total > 1000 ? 'high' : 'medium',
      auto_resolved: false,
    };

    setEvents(prev => [event, ...prev.slice(0, 19)]);

    // Show notification
    toast({
      title: "New Sale! 💰",
      description: `$${order.total} sale completed`,
    });
  };

  const handleSaleUpdate = (newOrder: any, oldOrder: any) => {
    if (newOrder.status === 'completed' && oldOrder.status !== 'completed') {
      handleNewSale(newOrder);
    }
  };

  const handleNewCommission = async (commission: any) => {
    console.log('New commission earned:', commission);

    // Fetch user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', commission.user_id)
      .single();

    const commissionUpdate: CommissionUpdate = {
      user_id: commission.user_id,
      user_name: profile?.full_name || 'Unknown User',
      amount: commission.commission_amount,
      sale_amount: commission.sale_amount,
      commission_rate: commission.commission_rate,
      created_at: commission.created_at,
    };

    setRecentCommissions(prev => [commissionUpdate, ...prev.slice(0, 4)]);

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      commission_pending: prev.commission_pending + commission.commission_amount,
    }));

    // Create business event
    const event: BusinessEvent = {
      id: `commission_${commission.id}`,
      type: 'commission',
      title: 'Commission Earned',
      description: `$${commission.commission_amount} commission earned`,
      data: commission,
      user_id: commission.user_id,
      created_at: commission.created_at,
      priority: 'medium',
      auto_resolved: true,
    };

    setEvents(prev => [event, ...prev.slice(0, 19)]);

    toast({
      title: "Commission Earned! 🎯",
      description: `$${commission.commission_amount} earned by ${commissionUpdate.user_name}`,
    });
  };

  const handleGoalUpdate = (newGoal: any, oldGoal: any) => {
    // Check if goal was achieved
    if (newGoal.current_count >= newGoal.target_count && oldGoal.current_count < oldGoal.target_count) {
      const event: BusinessEvent = {
        id: `goal_${newGoal.id}`,
        type: 'goal_achieved',
        title: 'Goal Achieved! 🏆',
        description: `${newGoal.goal_type} goal completed`,
        data: newGoal,
        user_id: newGoal.user_id,
        created_at: new Date().toISOString(),
        priority: 'high',
        auto_resolved: true,
      };

      setEvents(prev => [event, ...prev.slice(0, 19)]);
      setMetrics(prev => ({ ...prev, goals_achieved: prev.goals_achieved + 1 }));

      toast({
        title: "Goal Achieved! 🏆",
        description: `${newGoal.goal_type} goal completed!`,
      });
    }
  };

  const handleLowStockAlert = async (alert: any) => {
    console.log('Low stock alert:', alert);

    // Fetch product and store info
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', alert.product_id)
      .single();

    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('id', alert.store_id)
      .single();

    const event: BusinessEvent = {
      id: `stock_${alert.id}`,
      type: 'low_stock',
      title: 'Low Stock Alert',
      description: `${product?.name || 'Product'} is low at ${store?.name || 'store'}`,
      data: alert,
      store_id: alert.store_id,
      created_at: alert.created_at,
      priority: alert.alert_level === 'critical' ? 'urgent' : 'high',
      auto_resolved: false,
    };

    setEvents(prev => [event, ...prev.slice(0, 19)]);
    setMetrics(prev => ({ ...prev, low_stock_alerts: prev.low_stock_alerts + 1 }));

    toast({
      title: "Low Stock Alert! 📦",
      description: `${product?.name || 'Product'} needs restocking`,
      variant: "destructive",
    });
  };

  const handlePendingAnnouncement = (announcement: any) => {
    const event: BusinessEvent = {
      id: `announcement_${announcement.id}`,
      type: 'approval_needed',
      title: 'Approval Needed',
      description: `Sales announcement pending approval ($${announcement.sale_amount})`,
      data: announcement,
      created_at: announcement.created_at,
      priority: 'medium',
      auto_resolved: false,
    };

    setEvents(prev => [event, ...prev.slice(0, 19)]);
    setMetrics(prev => ({ ...prev, pending_approvals: prev.pending_approvals + 1 }));

    toast({
      title: "Approval Needed 📋",
      description: "Sales announcement waiting for approval",
    });
  };

  const handleUserPresenceUpdate = (presence: any) => {
    // Update active employees count
    fetchTodaysMetrics(); // Refresh metrics to get updated presence count
  };

  const resolveEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sale': return DollarSign;
      case 'goal_achieved': return Award;
      case 'low_stock': return Package;
      case 'schedule_change': return Calendar;
      case 'commission': return Target;
      case 'approval_needed': return Bell;
      default: return CheckCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 border-red-500';
      case 'high': return 'text-orange-600 border-orange-500';
      case 'medium': return 'text-blue-600 border-blue-500';
      case 'low': return 'text-gray-600 border-gray-500';
      default: return 'text-gray-600 border-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-time Business Logic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading business data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Metrics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Business Metrics
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${metrics.total_sales_today.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Today's Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.active_employees}</div>
              <div className="text-sm text-muted-foreground">Active Staff</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.pending_approvals}</div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.low_stock_alerts}</div>
              <div className="text-sm text-muted-foreground">Stock Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${metrics.commission_pending.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Pending Commissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.goals_achieved}</div>
              <div className="text-sm text-muted-foreground">Goals Achieved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Commission Updates */}
      {recentCommissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent Commission Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCommissions.map((commission, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{commission.user_name}</div>
                    <div className="text-sm text-muted-foreground">
                      ${commission.sale_amount} × {(commission.commission_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${commission.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(commission.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Events Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Live Business Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent events. Business activity will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event) => {
                const IconComponent = getEventIcon(event.type);
                return (
                  <div
                    key={event.id}
                    className={`border-l-4 pl-4 py-2 ${getPriorityColor(event.priority)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground">{event.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </span>
                        {!event.auto_resolved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveEvent(event.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};