import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, Target, Award, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const salesData = [
  { time: "9AM", sales: 1200, transactions: 15 },
  { time: "10AM", sales: 2800, transactions: 23 },
  { time: "11AM", sales: 3200, transactions: 28 },
  { time: "12PM", sales: 4100, transactions: 35 },
  { time: "1PM", sales: 3800, transactions: 31 },
  { time: "2PM", sales: 4500, transactions: 38 },
  { time: "3PM", sales: 5200, transactions: 42 },
  { time: "4PM", sales: 4800, transactions: 39 },
];

const categoryData = [
  { name: "Cleansers", value: 35, color: "hsl(var(--primary))" },
  { name: "Serums", value: 28, color: "hsl(var(--success))" },
  { name: "Moisturizers", value: 22, color: "hsl(var(--warning))" },
  { name: "Sunscreen", value: 15, color: "hsl(var(--accent))" },
];

const topStores = [
  { name: "Downtown Flagship", revenue: 8420, target: 8000, performance: 105.3 },
  { name: "Beverly Hills", revenue: 7890, target: 8500, performance: 92.8 },
  { name: "SoHo", revenue: 7650, target: 7500, performance: 102.0 },
  { name: "Malibu Spa", revenue: 6890, target: 7000, performance: 98.4 },
  { name: "Union Square", revenue: 6420, target: 6500, performance: 98.8 },
];

interface DashboardOverviewProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const DashboardOverview = ({ dateRange, selectedStore }: DashboardOverviewProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    dailyGoals: {
      revenueProgress: 0,
      transactionProgress: 0,
      satisfactionProgress: 96,
      revenueActual: 0,
      revenueTarget: 20000,
      transactionsActual: 0,
      transactionsTarget: 200,
    },
    peakHours: {
      bestHour: "3:00 PM",
      avgOrderValue: 0,
      conversionRate: 68.4,
      topCategory: "Cleansers",
    },
    alerts: [
      { type: "warning", title: "Low Stock Alert", description: "5 products below minimum" },
      { type: "success", title: "System Status", description: "All stores online" },
      { type: "info", title: "End of Day", description: "3 stores pending reports" },
    ],
    salesData: [],
    categoryData: [],
    topStores: [],
  });

  useEffect(() => {
    let isMounted = true;
    
    if (user && isMounted) {
      fetchDashboardData();
    }
    
    return () => {
      isMounted = false;
      // Cleanup large data structures
      setDashboardData(prev => ({
        ...prev,
        salesData: [],
        categoryData: [],
        topStores: [],
      }));
    };
  }, [user, dateRange, selectedStore]);

  const fetchDashboardData = async () => {
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

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      // Build store filter
      let storeFilter = {};
      if (selectedStore !== "all") {
        storeFilter = { store_id: selectedStore };
      }

      // Fetch orders data with optimized query
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id, total, created_at, status,
          stores!inner(business_id, name),
          order_items(total_price, product_id, products!inner(category_id))
        `)
        .eq("stores.business_id", membershipData.business_id)
        .gte("created_at", `${fromDate}T00:00:00`)
        .lte("created_at", `${toDate}T23:59:59`)
        .eq("status", "completed")
        .match(storeFilter)
        .limit(1000);

      // Calculate metrics
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalTransactions = ordersData?.length || 0;
      const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Generate hourly sales data (simplified)
      const hourlyData = [];
      for (let hour = 9; hour <= 20; hour++) {
        const hourOrders = ordersData?.filter(order => {
          const orderHour = new Date(order.created_at).getHours();
          return orderHour === hour;
        }) || [];
        
        hourlyData.push({
          time: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`,
          sales: hourOrders.reduce((sum, order) => sum + order.total, 0),
          transactions: hourOrders.length,
        });
      }

      // Get product categories data (simplified approach)
      const { data: productsData } = await supabase
        .from("order_items")
        .select(`
          *,
          products!inner(name, category_id)
        `)
        .in("order_id", ordersData?.map(order => order.id) || []);

      // Get category names
      const categoryIds = [...new Set(productsData?.map(item => item.products?.category_id).filter(Boolean))];
      const { data: categoriesData } = await supabase
        .from("product_categories")
        .select("id, name")
        .in("id", categoryIds);

      // Process category data
      const categoryStats: { [key: string]: number } = {};
      productsData?.forEach(item => {
        const categoryName = categoriesData?.find(cat => cat.id === item.products?.category_id)?.name || "Other";
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = 0;
        }
        categoryStats[categoryName] += Number(item.total_price);
      });

      const totalCategoryRevenue = Object.values(categoryStats).reduce((sum: number, value: number) => sum + value, 0);
      const categoryData = Object.entries(categoryStats).map(([name, value], index) => ({
        name,
        value: totalCategoryRevenue > 0 ? Math.round((value as number / totalCategoryRevenue) * 100) : 0,
        color: `hsl(var(--${['primary', 'success', 'warning', 'accent'][index % 4]}))`,
      }));

      // Get store performance
      const storeStats = {};
      ordersData?.forEach(order => {
        const storeName = order.stores?.name || "Unknown Store";
        if (!storeStats[storeName]) {
          storeStats[storeName] = { revenue: 0, transactions: 0 };
        }
        storeStats[storeName].revenue += order.total;
        storeStats[storeName].transactions += 1;
      });

      const topStores = Object.entries(storeStats).map(([name, stats]) => ({
        name,
        revenue: (stats as any).revenue,
        target: 8000, // Default target
        performance: Math.round(((stats as any).revenue / 8000) * 100),
      })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      setDashboardData({
        dailyGoals: {
          revenueProgress: Math.min((totalRevenue / 20000) * 100, 100),
          transactionProgress: Math.min((totalTransactions / 200) * 100, 100),
          satisfactionProgress: 96,
          revenueActual: totalRevenue,
          revenueTarget: 20000,
          transactionsActual: totalTransactions,
          transactionsTarget: 200,
        },
        peakHours: {
          bestHour: "3:00 PM",
          avgOrderValue,
          conversionRate: 68.4,
          topCategory: categoryData[0]?.name || "N/A",
        },
        alerts: [
          { type: "warning", title: "Low Stock Alert", description: "5 products below minimum" },
          { type: "success", title: "System Status", description: "All stores online" },
          { type: "info", title: "End of Day", description: "3 stores pending reports" },
        ],
        salesData: hourlyData,
        categoryData,
        topStores,
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid gap-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Goals Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Revenue Target</span>
                  <span className="text-sm text-muted-foreground">
                    ${dashboardData.dailyGoals.revenueActual.toLocaleString()} / ${dashboardData.dailyGoals.revenueTarget.toLocaleString()}
                  </span>
                </div>
                <Progress value={dashboardData.dailyGoals.revenueProgress} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Transactions</span>
                  <span className="text-sm text-muted-foreground">
                    {dashboardData.dailyGoals.transactionsActual} / {dashboardData.dailyGoals.transactionsTarget}
                  </span>
                </div>
                <Progress value={dashboardData.dailyGoals.transactionProgress} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm text-muted-foreground">4.8 / 5.0</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Performance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Best Hour</span>
                <Badge variant="default">3:00 PM</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Order Value</span>
                <span className="font-medium">${dashboardData.peakHours.avgOrderValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-medium text-success">68.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Top Category</span>
                <Badge variant="secondary">{dashboardData.peakHours.topCategory}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-warning' :
                    alert.type === 'success' ? 'bg-success' : 'bg-primary'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {dashboardData.categoryData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Stores */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Stores Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.topStores.map((store, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-pos-accent/30">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${store.revenue.toLocaleString()} / ${store.target.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={store.performance >= 100 ? "default" : "secondary"}
                    className={store.performance >= 100 ? "bg-success text-success-foreground" : ""}
                  >
                    {store.performance}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};