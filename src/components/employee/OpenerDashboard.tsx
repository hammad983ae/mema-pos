import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign,
  Trophy,
  Clock
} from "lucide-react";
import MobileGoalsTracker from "./MobileGoalsTracker";

interface DashboardStats {
  today_opens: number;
  week_opens: number;
  month_opens: number;
  total_revenue_generated: number;
  avg_open_value: number;
  conversion_rate: number;
}

const OpenerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    today_opens: 0,
    week_opens: 0,
    month_opens: 0,
    total_revenue_generated: 0,
    avg_open_value: 0,
    conversion_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOpenerStats();
    }
  }, [user]);

  const fetchOpenerStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayString = new Date().toISOString().split('T')[0];

      // Get opens for different periods
      const { data: todayOpens } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'open')
        .eq('status', 'completed')
        .gte('created_at', `${todayString}T00:00:00`)
        .lt('created_at', `${todayString}T23:59:59`);

      const { data: weekOpens } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'open')
        .eq('status', 'completed')
        .gte('created_at', startOfWeek.toISOString());

      const { data: monthOpens } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', user.id)
        .eq('sale_type', 'open')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      // Calculate stats
      const todayOpensCount = todayOpens?.length || 0;
      const weekOpensCount = weekOpens?.length || 0;
      const monthOpensCount = monthOpens?.length || 0;
      
      const totalRevenue = monthOpens?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const avgOpenValue = monthOpensCount > 0 ? totalRevenue / monthOpensCount : 0;

      setStats({
        today_opens: todayOpensCount,
        week_opens: weekOpensCount,
        month_opens: monthOpensCount,
        total_revenue_generated: totalRevenue,
        avg_open_value: avgOpenValue,
        conversion_rate: 85 // This would be calculated based on actual data
      });
    } catch (error) {
      console.error('Error fetching opener stats:', error);
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
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Opener Dashboard</h1>
          <p className="text-muted-foreground">Track your opening performance and goals</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Today's Opens</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.today_opens}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.round((stats.today_opens / Math.max(1, stats.week_opens / 7)) * 100 - 100)}% from daily avg
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Week Opens</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.week_opens}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(stats.week_opens / 7).toFixed(1)} per day
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Month Opens</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.month_opens}</div>
            <p className="text-xs text-muted-foreground">
              Total this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${stats.total_revenue_generated.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From opens this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Open Value</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.avg_open_value.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per opening
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.conversion_rate}%</div>
            <div className="mt-2">
              <Progress value={stats.conversion_rate} className="h-1" />
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
            <span className="text-sm">Opening Efficiency</span>
            <Badge variant={stats.conversion_rate >= 80 ? "default" : "secondary"}>
              {stats.conversion_rate >= 80 ? 'Excellent' : 'Good'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Daily Target Progress</span>
            <Badge variant={stats.today_opens >= 10 ? "default" : "outline"}>
              {stats.today_opens >= 10 ? 'On Track' : 'Behind'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Revenue Impact</span>
            <Badge variant={stats.total_revenue_generated >= 5000 ? "default" : "secondary"}>
              {stats.total_revenue_generated >= 5000 ? 'High Impact' : 'Moderate Impact'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Goals Tracker */}
      <MobileGoalsTracker />
    </div>
  );
};

export default OpenerDashboard;