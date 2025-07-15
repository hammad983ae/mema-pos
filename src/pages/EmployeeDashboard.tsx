import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Plus,
  BarChart3,
  FileText,
  Settings,
  Filter,
  Shield,
  Brain
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MobileGoalsTracker from "@/components/employee/MobileGoalsTracker";
import CommissionDashboard from "@/components/employee/CommissionDashboard";
import ScheduleNotifications from "@/components/employee/ScheduleNotifications";
import LocationPerformanceAnalytics from "@/components/employee/LocationPerformanceAnalytics";
import OpenerDashboard from "@/components/employee/OpenerDashboard";
import UpsellerDashboard from "@/components/employee/UpsellerDashboard";
import { PositionTypeSelector } from "@/components/team/PositionTypeSelector";

interface SalesGoal {
  id: string;
  goal_type: string;
  target_amount: number;
  target_transactions: number;
  start_date: string;
  end_date: string;
}

interface Schedule {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
  store_name?: string;
}

interface DailySales {
  total_sales: number;
  total_transactions: number;
  goal_progress: number;
}

interface SalesData {
  date: string;
  total_sales: number;
  transaction_count: number;
  avg_order_value: number;
}

const EmployeeDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [activeGoals, setActiveGoals] = useState<SalesGoal[]>([]);
  const [todaySales, setTodaySales] = useState<DailySales>({
    total_sales: 0,
    total_transactions: 0,
    goal_progress: 0
  });
  const [profile, setProfile] = useState<any>(null);
  const [clockedIn, setClockedIn] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  
  // Date range sales functionality
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [totalSalesInRange, setTotalSalesInRange] = useState(0);
  const [totalTransactionsInRange, setTotalTransactionsInRange] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      if (dateFrom && dateTo) {
        fetchSalesData();
      }
    }
  }, [user, dateFrom, dateTo]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user role first
      const { data: roleData } = await supabase
        .from("user_business_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
      }
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setProfile(profileData);

      // Fetch today's schedule
      const { data: scheduleData } = await supabase
        .from("employee_schedules")
        .select("*, stores(name)")
        .eq("user_id", user.id)
        .eq("schedule_date", today)
        .single();

      if (scheduleData) {
        setTodaySchedule({
          ...scheduleData,
          store_name: scheduleData.stores?.name
        });
      }

      // Fetch active sales goals
      const { data: goalsData } = await supabase
        .from("sales_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("end_date", today);

      setActiveGoals(goalsData || []);

      // Calculate today's sales performance
      const { data: ordersData } = await supabase
        .from("orders")
        .select("total")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`);

      const totalSales = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalTransactions = ordersData?.length || 0;

      // Calculate goal progress for today
      const todayGoal = activeGoals.find(goal => 
        goal.goal_type === "daily" && 
        new Date(goal.start_date) <= new Date(today) &&
        new Date(goal.end_date) >= new Date(today)
      );

      const goalProgress = todayGoal ? (totalSales / todayGoal.target_amount) * 100 : 0;

      setTodaySales({
        total_sales: totalSales,
        total_transactions: totalTransactions,
        goal_progress: Math.min(goalProgress, 100)
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockInOut = () => {
    setClockedIn(!clockedIn);
    toast({
      title: clockedIn ? "Clocked Out" : "Clocked In",
      description: `Successfully ${clockedIn ? "clocked out" : "clocked in"} at ${new Date().toLocaleTimeString()}`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const fetchSalesData = async () => {
    if (!user || !dateFrom || !dateTo) return;
    
    setLoadingSales(true);
    try {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("total, created_at")
        .eq("user_id", user.id)
        .gte("created_at", dateFrom.toISOString())
        .lte("created_at", dateTo.toISOString());

      if (ordersData) {
        // Group sales by date
        const salesByDate: { [key: string]: { total: number; count: number } } = {};
        
        ordersData.forEach(order => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          if (!salesByDate[date]) {
            salesByDate[date] = { total: 0, count: 0 };
          }
          salesByDate[date].total += parseFloat(order.total.toString());
          salesByDate[date].count += 1;
        });

        // Convert to array format
        const formattedData: SalesData[] = Object.entries(salesByDate).map(([date, data]) => ({
          date,
          total_sales: data.total,
          transaction_count: data.count,
          avg_order_value: data.total / data.count
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setSalesData(formattedData);
        
        // Calculate totals
        const totalSales = ordersData.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
        const totalTransactions = ordersData.length;
        
        setTotalSalesInRange(totalSales);
        setTotalTransactionsInRange(totalTransactions);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    } finally {
      setLoadingSales(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user has position type set and render appropriate dashboard
  if (!profile?.position_type) {
    return (
      <div className="min-h-screen bg-gradient-hero p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome, {profile?.full_name || "Employee"}!
              </h1>
              <p className="text-muted-foreground">
                Let's set up your position to get started
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
          <PositionTypeSelector 
            currentPositionType={profile?.position_type}
            onPositionSet={fetchDashboardData}
          />
        </div>
      </div>
    );
  }

  // Render position-specific dashboard
  if (profile?.position_type === 'opener') {
    return (
      <div className="min-h-screen bg-gradient-hero p-4">
        <div className="max-w-6xl mx-auto">
          <OpenerDashboard />
        </div>
      </div>
    );
  }

  if (profile?.position_type === 'upseller') {
    return (
      <div className="min-h-screen bg-gradient-hero p-4">
        <div className="max-w-6xl mx-auto">
          <UpsellerDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.full_name || "Employee"}!
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 sm:grid-cols-${userRole && ['business_owner', 'manager', 'office'].includes(userRole) ? '4' : '3'} gap-4`}>
          <Card className="hover:shadow-card transition-all cursor-pointer">
            <CardContent className="p-4 text-center">
              <Button 
                variant={clockedIn ? "destructive" : "default"}
                onClick={handleClockInOut}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                {clockedIn ? "Clock Out" : "Clock In"}
              </Button>
              {clockedIn && (
                <p className="text-xs text-muted-foreground mt-2">
                  Since {new Date().toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-card transition-all cursor-pointer"
            onClick={() => navigate("/employee/reports/submit")}
          >
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">EOD Report</h3>
              <p className="text-xs text-muted-foreground">Submit Report</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card transition-all cursor-pointer">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-primary mb-2" />
              <h3 className="font-semibold">Performance</h3>
              <p className="text-xs text-muted-foreground">View Metrics</p>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-card transition-all cursor-pointer"
            onClick={() => navigate("/sales-training")}
          >
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h3 className="font-semibold">AI Training</h3>
              <p className="text-xs text-muted-foreground">Master Sales</p>
            </CardContent>
          </Card>

          {/* Chargeback Disputes - Only for office, manager, and business owner roles */}
          {userRole && ['business_owner', 'manager', 'office'].includes(userRole) && (
            <Card 
              className="hover:shadow-card transition-all cursor-pointer"
              onClick={() => navigate("/chargeback-disputes")}
            >
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <h3 className="font-semibold">Chargeback Disputes</h3>
                <p className="text-xs text-muted-foreground">Fight Chargebacks</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule ? (
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {todaySchedule.start_time} - {todaySchedule.end_time}
                    </span>
                    <Badge variant={todaySchedule.status === "scheduled" ? "default" : "outline"}>
                      {todaySchedule.status}
                    </Badge>
                  </div>
                  {todaySchedule.store_name && (
                    <p className="text-sm text-muted-foreground">
                      📍 {todaySchedule.store_name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={todaySchedule.status === "scheduled" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {todaySchedule.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No schedule for today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Data Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range Picker */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                onClick={fetchSalesData}
                disabled={!dateFrom || !dateTo || loadingSales}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                {loadingSales ? "Loading..." : "Analyze"}
              </Button>
            </div>

            {/* Sales Summary */}
            {salesData.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-card p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    ${totalSalesInRange.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
                <div className="bg-gradient-card p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {totalTransactionsInRange}
                  </div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
                <div className="bg-gradient-card p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-warning mb-1">
                    ${totalTransactionsInRange > 0 ? (totalSalesInRange / totalTransactionsInRange).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Order Value</div>
                </div>
              </div>
            )}

            {/* Daily Breakdown */}
            {salesData.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Daily Breakdown</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {salesData.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {format(new Date(day.date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.transaction_count} transactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          ${day.total_sales.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: ${day.avg_order_value.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {salesData.length === 0 && dateFrom && dateTo && !loadingSales && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sales data found for the selected date range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Performance & Goals */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sales Today</span>
                <span className="text-2xl font-bold text-primary">
                  ${todaySales.total_sales.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transactions</span>
                <span className="text-lg font-semibold">
                  {todaySales.total_transactions}
                </span>
              </div>
              {activeGoals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Goal Progress</span>
                    <span className="text-sm font-medium">
                      {todaySales.goal_progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={todaySales.goal_progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission & Performance Dashboard */}
          <CommissionDashboard />

          {/* Mobile Goals Tracker */}
          <MobileGoalsTracker />
        </div>

        {/* Schedule Notifications */}
        <ScheduleNotifications />

        {/* Location Performance Analytics - Only for Managers */}
        {userRole && ['business_owner', 'manager'].includes(userRole) && (
          <LocationPerformanceAnalytics />
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;