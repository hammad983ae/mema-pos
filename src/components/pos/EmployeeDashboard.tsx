import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  Award, 
  Users,
  Calendar,
  LogOut,
  Banknote,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  username: string;
  full_name: string;
  position_type: string;
  business_id: string;
}

interface EmployeeDashboardProps {
  employee: Employee;
  onSignOut: () => void;
}

interface DashboardStats {
  todaysSales: number;
  todaysTransactions: number;
  weeklyCommission: number;
  monthlyCommission: number;
  clockedIn: boolean;
  clockInTime?: string;
  hoursWorked: number;
  salesGoal: number;
  salesProgress: number;
}

export function EmployeeDashboard({ employee, onSignOut }: EmployeeDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    todaysSales: 0,
    todaysTransactions: 0,
    weeklyCommission: 0,
    monthlyCommission: 0,
    clockedIn: false,
    hoursWorked: 0,
    salesGoal: 5000,
    salesProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeStats();
  }, [employee.id]);

  const fetchEmployeeStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);

      // Fetch today's sales
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', employee.id)
        .gte('created_at', today + 'T00:00:00')
        .lt('created_at', today + 'T23:59:59')
        .eq('status', 'completed');

      // Fetch commission data
      const { data: commissionData } = await supabase
        .from('commission_payments')
        .select('commission_amount, created_at')
        .eq('user_id', employee.id)
        .eq('is_paid', false);

      // Fetch clock status
      const { data: clockStatus } = await supabase
        .from('employee_clock_status')
        .select('*')
        .eq('user_id', employee.id)
        .eq('is_active', true)
        .single();

      const todaysSales = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const todaysTransactions = todayOrders?.length || 0;

      const weeklyCommission = commissionData?.filter(c => 
        new Date(c.created_at) >= weekStart
      ).reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      const monthlyCommission = commissionData?.filter(c => 
        new Date(c.created_at) >= monthStart
      ).reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      setStats({
        todaysSales,
        todaysTransactions,
        weeklyCommission,
        monthlyCommission,
        clockedIn: !!clockStatus,
        clockInTime: clockStatus?.clocked_in_at,
        hoursWorked: clockStatus ? calculateHoursWorked(clockStatus.clocked_in_at) : 0,
        salesGoal: 5000, // This could come from employee goals table
        salesProgress: Math.min((todaysSales / 1000) * 100, 100) // Progress towards daily goal
      });
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHoursWorked = (clockInTime: string) => {
    const clockIn = new Date(clockInTime);
    const now = new Date();
    const diffMs = now.getTime() - clockIn.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-success bg-clip-text text-transparent mb-3">
              Welcome back, {employee.full_name}
            </h2>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary border-primary/20">
                {employee.position_type.charAt(0).toUpperCase() + employee.position_type.slice(1)}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className={`w-3 h-3 rounded-full ${stats.clockedIn ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats.clockedIn ? `Clocked in at ${new Date(stats.clockInTime!).toLocaleTimeString()}` : 'Not clocked in'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={onSignOut} className="hover:bg-muted/50">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-effect border-0 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shadow-soft">
                <DollarSign className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-muted-foreground text-sm mb-1">Today's Sales</h3>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.todaysSales)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{stats.todaysTransactions} transactions</p>
                  {stats.todaysTransactions > 0 && (
                    <div className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                      +{stats.todaysTransactions}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-effect border-0 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-success/20 to-success/10 rounded-xl flex items-center justify-center shadow-soft">
                <Banknote className="h-7 w-7 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-muted-foreground text-sm mb-1">This Week</h3>
                <div className="text-2xl font-bold text-success">{formatCurrency(stats.weeklyCommission)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">Commission earned</p>
                  <div className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                    Weekly
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-effect border-0 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center shadow-soft">
                <Calendar className="h-7 w-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-muted-foreground text-sm mb-1">This Month</h3>
                <div className="text-2xl font-bold text-blue-500">{formatCurrency(stats.monthlyCommission)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">Total commission</p>
                  <div className="text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
                    Monthly
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-effect border-0 hover:shadow-soft transition-all duration-300 hover:scale-[1.02] p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-xl flex items-center justify-center shadow-soft">
                <Clock className="h-7 w-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-muted-foreground text-sm mb-1">Hours Today</h3>
                <div className="text-2xl font-bold text-orange-500">{stats.hoursWorked}h</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {stats.clockedIn ? 'Currently working' : 'Not clocked in'}
                  </p>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    stats.clockedIn 
                      ? 'text-success bg-success/10' 
                      : 'text-muted-foreground bg-muted/50'
                  }`}>
                    {stats.clockedIn ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sales Progress & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-effect border-0 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl text-foreground">Daily Sales Goal</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{formatCurrency(stats.todaysSales)} / {formatCurrency(1000)}</span>
              </div>
              <div className="space-y-2">
                <Progress value={stats.salesProgress} className="h-3 bg-muted" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stats.salesProgress >= 100 ? (
                  <div className="flex items-center gap-2 text-success">
                    <Award className="h-4 w-4" />
                    <span className="font-medium">🎉 Goal achieved!</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {Math.round(stats.salesProgress)}% complete • {formatCurrency(1000 - stats.todaysSales)} remaining
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="glass-effect border-0 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-xl text-foreground">Performance Insights</h3>
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Avg. Sale Value</span>
                <span className="font-bold text-primary">
                  {stats.todaysTransactions > 0 
                    ? formatCurrency(stats.todaysSales / stats.todaysTransactions)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Commission Rate</span>
                <span className="font-bold text-success">
                  {stats.todaysSales > 0 
                    ? `${Math.round((stats.weeklyCommission / stats.todaysSales) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Sales per Hour</span>
                <span className="font-bold text-orange-500">
                  {stats.hoursWorked > 0 
                    ? formatCurrency(stats.todaysSales / stats.hoursWorked)
                    : formatCurrency(0)
                  }
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-effect border-0 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-xl text-foreground">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-3 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">View Sales</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-3 hover:bg-success/5 hover:border-success/20 transition-all duration-200">
              <div className="p-2 rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-medium">Team Stats</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-3 hover:bg-orange-500/5 hover:border-orange-500/20 transition-all duration-200">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Award className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-medium">Goals</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-3 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all duration-200">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Schedule</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}