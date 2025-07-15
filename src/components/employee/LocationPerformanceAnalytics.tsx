import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar as CalendarIcon,
  Target,
  Clock,
  DollarSign,
  Star,
  Users,
  Filter,
  Award
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationPerformance {
  store_id: string;
  store_name: string;
  store_address: string;
  total_sales: number;
  total_transactions: number;
  avg_order_value: number;
  hours_worked: number;
  sales_per_hour: number;
  shift_count: number;
  performance_score: number;
  goals_achieved: number;
  total_goals: number;
}

interface PerformanceComparison {
  best_location: LocationPerformance | null;
  worst_location: LocationPerformance | null;
  total_locations: number;
  overall_avg_sales: number;
}

const LocationPerformanceAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [locationPerformance, setLocationPerformance] = useState<LocationPerformance[]>([]);
  const [comparison, setComparison] = useState<PerformanceComparison>({
    best_location: null,
    worst_location: null,
    total_locations: 0,
    overall_avg_sales: 0
  });

  useEffect(() => {
    if (user) {
      fetchLocationPerformance();
    }
  }, [user, dateFrom, dateTo]);

  const fetchLocationPerformance = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fromDate = dateFrom.toISOString().split('T')[0];
      const toDate = dateTo.toISOString().split('T')[0];

      // Get employee schedules for the date range
      const { data: schedules, error: schedulesError } = await supabase
        .from("employee_schedules")
        .select(`
          store_id,
          schedule_date,
          start_time,
          end_time,
          stores!inner(name, address)
        `)
        .eq("user_id", user.id)
        .gte("schedule_date", fromDate)
        .lte("schedule_date", toDate)
        .eq("status", "scheduled");

      if (schedulesError) throw schedulesError;

      // Get orders for the same period
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("store_id, total, created_at")
        .eq("user_id", user.id)
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .eq("status", "completed");

      if (ordersError) throw ordersError;

      // Get sales goals for the period
      const { data: goals, error: goalsError } = await supabase
        .from("sales_goals")
        .select("target_amount, current_count, target_count, is_active")
        .eq("user_id", user.id)
        .gte("start_date", fromDate)
        .lte("end_date", toDate);

      if (goalsError) throw goalsError;

      // Process data by location
      const locationMap = new Map<string, LocationPerformance>();

      // Initialize locations from schedules
      schedules?.forEach(schedule => {
        const storeId = schedule.store_id;
        if (!locationMap.has(storeId)) {
          locationMap.set(storeId, {
            store_id: storeId,
            store_name: schedule.stores?.name || "Unknown Store",
            store_address: schedule.stores?.address || "No address",
            total_sales: 0,
            total_transactions: 0,
            avg_order_value: 0,
            hours_worked: 0,
            sales_per_hour: 0,
            shift_count: 0,
            performance_score: 0,
            goals_achieved: 0,
            total_goals: 0
          });
        }

        const location = locationMap.get(storeId)!;
        location.shift_count += 1;

        // Calculate hours worked (simplified calculation)
        const startTime = new Date(`2000-01-01T${schedule.start_time}`);
        const endTime = new Date(`2000-01-01T${schedule.end_time}`);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        location.hours_worked += Math.max(hours, 0);
      });

      // Add sales data
      orders?.forEach(order => {
        const location = locationMap.get(order.store_id);
        if (location) {
          location.total_sales += parseFloat(order.total.toString());
          location.total_transactions += 1;
        }
      });

      // Calculate metrics and performance scores
      const performanceArray: LocationPerformance[] = [];
      locationMap.forEach(location => {
        if (location.total_transactions > 0) {
          location.avg_order_value = location.total_sales / location.total_transactions;
        }
        if (location.hours_worked > 0) {
          location.sales_per_hour = location.total_sales / location.hours_worked;
        }

        // Calculate performance score (0-100 based on multiple factors)
        const salesScore = Math.min((location.total_sales / 1000) * 20, 40); // Max 40 points for sales
        const efficiencyScore = Math.min((location.sales_per_hour / 50) * 30, 30); // Max 30 points for efficiency
        const consistencyScore = Math.min((location.shift_count / 10) * 30, 30); // Max 30 points for consistency
        
        location.performance_score = Math.round(salesScore + efficiencyScore + consistencyScore);
        
        // Goals data (simplified - calculate achievement based on current vs target)
        location.total_goals = goals?.length || 0;
        location.goals_achieved = goals?.filter(g => 
          g.current_count >= g.target_count || 
          (g.target_amount && location.total_sales >= g.target_amount)
        ).length || 0;

        performanceArray.push(location);
      });

      // Sort by performance score
      performanceArray.sort((a, b) => b.performance_score - a.performance_score);

      // Calculate comparison metrics
      const totalSales = performanceArray.reduce((sum, loc) => sum + loc.total_sales, 0);
      const avgSales = performanceArray.length > 0 ? totalSales / performanceArray.length : 0;

      setLocationPerformance(performanceArray);
      setComparison({
        best_location: performanceArray[0] || null,
        worst_location: performanceArray[performanceArray.length - 1] || null,
        total_locations: performanceArray.length,
        overall_avg_sales: avgSales
      });

    } catch (error) {
      console.error("Error fetching location performance:", error);
      toast({
        title: "Error",
        description: "Failed to load location performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "Excellent" };
    if (score >= 60) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Improvement" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading performance analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Location Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
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
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              onClick={fetchLocationPerformance}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Analyze Performance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {comparison.total_locations > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Best Performance</h3>
              </div>
              {comparison.best_location && (
                <div>
                  <p className="font-medium">{comparison.best_location.store_name}</p>
                  <p className="text-2xl font-bold text-success">
                    {comparison.best_location.performance_score}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${comparison.best_location.total_sales.toFixed(2)} total sales
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Locations Worked</h3>
              </div>
              <p className="text-2xl font-bold text-primary">
                {comparison.total_locations}
              </p>
              <p className="text-sm text-muted-foreground">
                Different store locations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-warning" />
                <h3 className="font-semibold">Average Sales</h3>
              </div>
              <p className="text-2xl font-bold text-warning">
                ${comparison.overall_avg_sales.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Per location average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {locationPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No performance data found for the selected period</p>
              <p className="text-xs">Try adjusting the date range or check your work schedule</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locationPerformance.map((location, index) => {
                const badge = getPerformanceBadge(location.performance_score);
                return (
                  <div
                    key={location.store_id}
                    className="p-4 bg-gradient-card rounded-lg border hover:shadow-card transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {index === 0 && <Award className="h-4 w-4 text-success" />}
                          <h3 className="font-semibold">{location.store_name}</h3>
                        </div>
                        <Badge variant={badge.variant}>
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-2xl font-bold", getPerformanceColor(location.performance_score))}>
                          {location.performance_score}%
                        </p>
                        <p className="text-xs text-muted-foreground">Performance Score</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <p>{location.store_address}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="font-semibold text-primary">
                          ${location.total_sales.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="font-semibold">{location.total_transactions}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Order</p>
                        <p className="font-semibold">${location.avg_order_value.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sales/Hour</p>
                        <p className="font-semibold">${location.sales_per_hour.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{location.hours_worked.toFixed(1)} hours worked</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{location.shift_count} shifts completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{location.goals_achieved}/{location.total_goals} goals achieved</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Performance Score</span>
                        <span>{location.performance_score}%</span>
                      </div>
                      <Progress value={location.performance_score} className="h-2" />
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

export default LocationPerformanceAnalytics;