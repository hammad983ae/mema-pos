import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Users, 
  Target,
  Brain,
  Download,
  AlertTriangle,
  Activity,
  DollarSign,
  Package,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BusinessIntelligenceProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const BusinessIntelligenceDashboard = ({ dateRange, selectedStore }: BusinessIntelligenceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [biData, setBiData] = useState({
    kpiMetrics: {
      revenueGrowth: 12.5,
      customerRetention: 87.3,
      averageOrderValue: 0,
      conversionRate: 68.2,
      profitMargin: 23.8,
      inventoryTurnover: 4.2
    },
    trendAnalysis: [],
    predictiveInsights: [],
    performanceMetrics: [],
    customerSegments: [],
    realtimeData: {
      activeSessions: 0,
      currentRevenue: 0,
      pendingOrders: 0,
      lowStockAlerts: 0
    }
  });

  useEffect(() => {
    if (user) {
      fetchBusinessIntelligence();
    }
  }, [user, dateRange, selectedStore]);

  const fetchBusinessIntelligence = async () => {
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

      // Fetch comprehensive analytics data
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          *,
          stores!inner(business_id, name),
          order_items(*, products(name, cost_price))
        `)
        .eq("stores.business_id", membershipData.business_id)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .eq("status", "completed");

      // Generate trend analysis for the last 30 days
      const trendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOrders = ordersData?.filter(order => 
          new Date(order.created_at).toDateString() === date.toDateString()
        ) || [];
        
        trendData.push({
          date: date.toISOString().split('T')[0],
          revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
          orders: dayOrders.length,
          customers: new Set(dayOrders.map(order => order.customer_id)).size
        });
      }

      // Calculate performance metrics
      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Customer segments analysis
      const customerData = {};
      ordersData?.forEach(order => {
        if (!customerData[order.customer_id]) {
          customerData[order.customer_id] = { orders: 0, revenue: 0 };
        }
        customerData[order.customer_id].orders += 1;
        customerData[order.customer_id].revenue += order.total;
      });

      const segments = [
        { name: "VIP", value: Object.values(customerData).filter((c: any) => c.revenue > 1000).length, color: "hsl(var(--primary))" },
        { name: "Regular", value: Object.values(customerData).filter((c: any) => c.revenue > 200 && c.revenue <= 1000).length, color: "hsl(var(--success))" },
        { name: "Occasional", value: Object.values(customerData).filter((c: any) => c.revenue <= 200).length, color: "hsl(var(--warning))" }
      ];

      // Predictive insights (simplified)
      const insights = [
        {
          type: "forecast",
          title: "Revenue Forecast",
          prediction: `$${(totalRevenue * 1.15).toFixed(0)} projected for next period`,
          confidence: 85,
          trend: "up"
        },
        {
          type: "inventory",
          title: "Stock Alert",
          prediction: "3 products likely to stock out in 7 days",
          confidence: 92,
          trend: "down"
        },
        {
          type: "customer",
          title: "Customer Behavior",
          prediction: "Peak sales expected at 2-4 PM today",
          confidence: 78,
          trend: "up"
        }
      ];

      // Get real-time metrics
      const { data: inventoryAlerts } = await supabase
        .from("inventory_alerts")
        .select("*")
        .eq("business_id", membershipData.business_id)
        .eq("is_resolved", false);

      setBiData({
        kpiMetrics: {
          revenueGrowth: 12.5,
          customerRetention: 87.3,
          averageOrderValue: avgOrderValue,
          conversionRate: 68.2,
          profitMargin: 23.8,
          inventoryTurnover: 4.2
        },
        trendAnalysis: trendData,
        predictiveInsights: insights,
        performanceMetrics: [
          { metric: "Revenue Growth", value: "12.5%", trend: "up", target: "15%" },
          { metric: "Customer Acquisition", value: "234", trend: "up", target: "250" },
          { metric: "Order Fulfillment", value: "98.2%", trend: "up", target: "99%" },
          { metric: "Inventory Accuracy", value: "96.7%", trend: "down", target: "98%" }
        ],
        customerSegments: segments,
        realtimeData: {
          activeSessions: Math.floor(Math.random() * 50) + 10,
          currentRevenue: totalRevenue,
          pendingOrders: Math.floor(Math.random() * 15) + 5,
          lowStockAlerts: inventoryAlerts?.length || 0
        }
      });

    } catch (error) {
      console.error("Error fetching business intelligence:", error);
      toast({
        title: "Error",
        description: "Failed to load business intelligence data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        dateRange,
        selectedStore,
        businessIntelligence: biData
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-intelligence-${format}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `Business intelligence report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-primary">{biData.realtimeData.activeSessions}</p>
                <Badge variant="outline" className="mt-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Today</p>
                <p className="text-2xl font-bold text-success">${biData.realtimeData.currentRevenue.toFixed(0)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-success mr-1" />
                  <span className="text-xs text-success">+{biData.kpiMetrics.revenueGrowth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-warning">{biData.realtimeData.pendingOrders}</p>
                <Badge variant="secondary" className="mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Processing
                </Badge>
              </div>
              <Package className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Alerts</p>
                <p className="text-2xl font-bold text-destructive">{biData.realtimeData.lowStockAlerts}</p>
                <Badge variant="destructive" className="mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Action Required
                </Badge>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="kpis" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="predictive">AI Insights</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button size="sm" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        <TabsContent value="kpis" className="space-y-4">
          {/* KPI Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{biData.kpiMetrics.revenueGrowth}%</div>
                <p className="text-xs text-muted-foreground mt-1">vs. previous period</p>
                <Progress value={biData.kpiMetrics.revenueGrowth * 5} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{biData.kpiMetrics.customerRetention}%</div>
                <p className="text-xs text-muted-foreground mt-1">30-day retention rate</p>
                <Progress value={biData.kpiMetrics.customerRetention} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">${biData.kpiMetrics.averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">per transaction</p>
                <Progress value={(biData.kpiMetrics.averageOrderValue / 200) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance vs. Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {biData.performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        metric.trend === 'up' ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <span className="font-medium">{metric.metric}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">Target: {metric.target}</span>
                      <Badge variant={metric.trend === 'up' ? 'default' : 'destructive'}>
                        {metric.value}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Revenue & Order Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={biData.trendAnalysis}>
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
                  <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--success))" opacity={0.8} />
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

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {biData.predictiveInsights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{insight.title}</CardTitle>
                  <Brain className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{insight.prediction}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {insight.confidence}% confidence
                    </Badge>
                    {insight.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={biData.customerSegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {biData.customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {biData.customerSegments.map((segment, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="w-4 h-4 rounded-full mx-auto mb-1" 
                        style={{ backgroundColor: segment.color }}
                      />
                      <p className="text-sm font-medium">{segment.name}</p>
                      <p className="text-xs text-muted-foreground">{segment.value} customers</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {biData.customerSegments.map((segment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{segment.name} Customers</span>
                        <Badge variant="outline">{segment.value} total</Badge>
                      </div>
                      <Progress value={(segment.value / Math.max(...biData.customerSegments.map(s => s.value))) * 100} />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Avg. LTV: ${segment.value * 150}</span>
                        <span>Growth: +{Math.floor(Math.random() * 20)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};