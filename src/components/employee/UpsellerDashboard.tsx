import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Target, 
  DollarSign,
  Trophy,
  Clock,
  BarChart3
} from "lucide-react";
import MobileGoalsTracker from "./MobileGoalsTracker";

interface DashboardStats {
  today_upsells: number;
  week_upsells: number;
  month_upsells: number;
  total_upsell_revenue: number;
  avg_upsell_value: number;
  upsell_rate: number;
}

const UpsellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    today_upsells: 0,
    week_upsells: 0,
    month_upsells: 0,
    total_upsell_revenue: 0,
    avg_upsell_value: 0,
    upsell_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpsellerStats();
    }
  }, [user]);

  const fetchUpsellerStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayString = new Date().toISOString().split('T')[0];

      // Get upsells for different periods
      const { data: todayUpsells } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'upsell')
        .eq('status', 'completed')
        .gte('created_at', `${todayString}T00:00:00`)
        .lt('created_at', `${todayString}T23:59:59`);

      const { data: weekUpsells } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'upsell')
        .eq('status', 'completed')
        .gte('created_at', startOfWeek.toISOString());

      const { data: monthUpsells } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'upsell')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Get total orders for upsell rate calculation
      const { data: totalOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Calculate stats
      const todayUpsellsCount = todayUpsells?.length || 0;
      const weekUpsellsCount = weekUpsells?.length || 0;
      const monthUpsellsCount = monthUpsells?.length || 0;
      
      const totalUpsellRevenue = monthUpsells?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const avgUpsellValue = monthUpsellsCount > 0 ? totalUpsellRevenue / monthUpsellsCount : 0;
      const upsellRate = totalOrders?.length ? (monthUpsellsCount / totalOrders.length) * 100 : 0;

      setStats({
        today_upsells: todayUpsellsCount,
        week_upsells: weekUpsellsCount,
        month_upsells: monthUpsellsCount,
        total_upsell_revenue: totalUpsellRevenue,
        avg_upsell_value: avgUpsellValue,
        upsell_rate: upsellRate
      });
    } catch (error) {
      console.error('Error fetching upseller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-success/10 rounded-lg">
          <BarChart3 className="h-6 w-6 text-success" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Upseller Dashboard</h1>
          <p className="text-muted-foreground">Track your upselling performance and revenue impact</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Today's Upsells</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.today_upsells}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((stats.today_upsells / Math.max(1, stats.week_upsells / 7)) * 100 - 100)}% from daily avg
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Week Upsells</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.week_upsells}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(stats.week_upsells / 7).toFixed(1)} per day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Month Upsells</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.month_upsells}</div>
            <p className="text-xs text-muted-foreground">
              Total this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Upsell Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${stats.total_upsell_revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From upsells this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Upsell Value</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.avg_upsell_value.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per upsell transaction
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Upsell Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.upsell_rate.toFixed(1)}%</div>
            <div className="mt-2">
              <Progress value={stats.upsell_rate} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Upselling Efficiency</span>
            <Badge variant={stats.upsell_rate >= 15 ? "default" : "secondary"}>
              {stats.upsell_rate >= 15 ? 'Excellent' : 'Good'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Revenue Impact</span>
            <Badge variant={stats.avg_upsell_value >= 1500 ? "default" : "outline"}>
              {stats.avg_upsell_value >= 1500 ? 'High Value' : 'Standard Value'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Daily Target Progress</span>
            <Badge variant={stats.today_upsells >= 3 ? "default" : "outline"}>
              {stats.today_upsells >= 3 ? 'On Track' : 'Behind Target'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Monthly Performance</span>
            <Badge variant={stats.total_upsell_revenue >= 15000 ? "default" : "secondary"}>
              {stats.total_upsell_revenue >= 15000 ? 'Exceeding Goals' : 'Making Progress'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Goals Tracker */}
      <MobileGoalsTracker />
    </div>
  );
};

export default UpsellerDashboard;