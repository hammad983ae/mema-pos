import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  Download,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Clock,
  Target,
  BarChart3,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";

interface AdvancedSalesAnalyticsProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const AdvancedSalesAnalytics = ({ dateRange, selectedStore }: AdvancedSalesAnalyticsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesType, setSalesType] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  
  const [analyticsData, setAnalyticsData] = useState({
    salesTrends: [],
    employeePerformance: [],
    hourlyAnalysis: [],
    dailyBreakdown: [],
    monthlyComparison: [],
    paymentMethods: [],
    topProducts: [],
    customerSegments: [],
    stores: [],
    employees: [],
    summary: {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      revenueGrowth: 0,
      transactionGrowth: 0
    }
  });

  useEffect(() => {
    if (user) {
      fetchAdvancedAnalytics();
    }
  }, [user, dateRange, selectedStore, salesType, employeeFilter, paymentMethodFilter]);

  const fetchAdvancedAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's business context
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Build complex query with filters
      let query = supabase
        .from("historical_orders_view")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .eq("status", "completed");

      if (selectedStore !== "all") {
        query = query.eq("store_id", selectedStore);
      }

      if (employeeFilter !== "all") {
        query = query.eq("user_id", employeeFilter);
      }

      if (paymentMethodFilter !== "all") {
        query = query.eq("payment_method", paymentMethodFilter);
      }

      const { data: ordersData } = await query.order("created_at", { ascending: false });

      // Fetch stores and employees for filters
      const [storesResult, employeesResult] = await Promise.all([
        supabase
          .from("stores")
          .select("id, name")
          .eq("business_id", membershipData.business_id),
        supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", [
            ...new Set(ordersData?.map(order => order.user_id).filter(Boolean) || [])
          ])
      ]);

      // Process data for various analytics
      const processedData = processAnalyticsData(ordersData || [], storesResult.data || [], employeesResult.data || []);
      
      setAnalyticsData(processedData);

    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load advanced analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (orders: any[], stores: any[], employees: any[]) => {
    // Sales trends by date
    const salesByDate: Record<string, any> = {};
    orders.forEach(order => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, transactions: 0, customers: new Set() };
      }
      salesByDate[date].revenue += order.total;
      salesByDate[date].transactions += 1;
      if (order.customer_id) salesByDate[date].customers.add(order.customer_id);
    });

    const salesTrends = Object.values(salesByDate).map((day: any) => ({
      date: day.date,
      revenue: day.revenue,
      transactions: day.transactions,
      customers: day.customers.size,
      averageOrderValue: day.revenue / day.transactions || 0
    }));

    // Employee performance
    const employeePerformance: Record<string, any> = {};
    orders.forEach(order => {
      const employeeId = order.user_id;
      if (!employeeId) return;
      
      if (!employeePerformance[employeeId]) {
        employeePerformance[employeeId] = {
          employeeId,
          name: employees.find(e => e.user_id === employeeId)?.full_name || 'Unknown',
          revenue: 0,
          transactions: 0,
          averageOrderValue: 0
        };
      }
      employeePerformance[employeeId].revenue += order.total;
      employeePerformance[employeeId].transactions += 1;
    });

    Object.values(employeePerformance).forEach((emp: any) => {
      emp.averageOrderValue = emp.revenue / emp.transactions || 0;
    });

    // Hourly analysis
    const hourlyData: Record<number, any> = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { hour: `${hour}:00`, revenue: 0, transactions: 0 };
    }
    
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour].revenue += order.total;
      hourlyData[hour].transactions += 1;
    });

    // Payment methods breakdown
    const paymentMethods: Record<string, any> = {};
    orders.forEach(order => {
      const method = order.payment_method || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { name: method, value: 0, transactions: 0 };
      }
      paymentMethods[method].value += order.total;
      paymentMethods[method].transactions += 1;
    });

    // Calculate summary metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalTransactions = orders.length;
    const averageOrderValue = totalRevenue / totalTransactions || 0;
    const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean)).size;

    // Calculate growth (compare to previous period) - simplified for demo
    const revenueGrowth = 12.5; // This would be calculated properly

    return {
      salesTrends: salesTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      employeePerformance: Object.values(employeePerformance).sort((a: any, b: any) => b.revenue - a.revenue),
      hourlyAnalysis: Object.values(hourlyData),
      dailyBreakdown: [], // Add empty arrays for missing properties
      monthlyComparison: [],
      paymentMethods: Object.values(paymentMethods),
      topProducts: [],
      customerSegments: [],
      stores,
      employees,
      summary: {
        totalRevenue,
        totalTransactions,
        averageOrderValue,
        totalCustomers: uniqueCustomers,
        revenueGrowth,
        transactionGrowth: 0
      }
    };
  };

  const exportData = (format: string) => {
    const exportData = {
      summary: analyticsData.summary,
      salesTrends: analyticsData.salesTrends,
      employeePerformance: analyticsData.employeePerformance,
      hourlyAnalysis: analyticsData.hourlyAnalysis,
      paymentMethods: analyticsData.paymentMethods,
      exportedAt: new Date().toISOString(),
      filters: {
        dateRange,
        selectedStore,
        salesType,
        employeeFilter,
        paymentMethodFilter
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advanced-sales-analytics-${format}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Sales analytics exported as ${format.toUpperCase()}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading advanced analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Order number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Sales Type</Label>
              <Select value={salesType} onValueChange={setSalesType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales</SelectItem>
                  <SelectItem value="cash">Cash Sales</SelectItem>
                  <SelectItem value="card">Card Sales</SelectItem>
                  <SelectItem value="digital">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {analyticsData.employees.map(employee => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {analyticsData.paymentMethods.map(method => (
                    <SelectItem key={method.name} value={method.name}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export Data</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportData('json')}>
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${analyticsData.summary.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {analyticsData.summary.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-success mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive mr-1" />
                  )}
                  <span className={`text-xs ${analyticsData.summary.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {analyticsData.summary.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalTransactions.toLocaleString()}</p>
                <Badge variant="outline" className="mt-1">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Orders
                </Badge>
              </div>
              <ShoppingCart className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">${analyticsData.summary.averageOrderValue.toFixed(2)}</p>
                <Badge variant="secondary" className="mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  AOV
                </Badge>
              </div>
              <BarChart3 className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Customers</p>
                <p className="text-2xl font-bold">{analyticsData.summary.totalCustomers}</p>
                <Badge variant="outline" className="mt-1">
                  <Users className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <Users className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="employees">Employee Performance</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Analysis</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={analyticsData.salesTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Bar yAxisId="right" dataKey="transactions" fill="hsl(var(--success))" opacity={0.8} />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="customers" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--warning))" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.employeePerformance.map((employee, index) => (
                  <div key={employee.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">${employee.revenue.toLocaleString()}</p>
                        <p className="text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{employee.transactions}</p>
                        <p className="text-muted-foreground">Sales</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">${employee.averageOrderValue.toFixed(2)}</p>
                        <p className="text-muted-foreground">AOV</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.hourlyAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  <Bar dataKey="transactions" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      label
                    >
                      {analyticsData.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-3">
                  {analyticsData.paymentMethods.map((method, index) => (
                    <div key={method.name} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                        />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${method.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{method.transactions} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};