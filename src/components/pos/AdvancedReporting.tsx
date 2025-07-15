import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users,
  Package,
  Download,
  Calendar,
  Filter,
  FileText,
  PieChart
} from "lucide-react";
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from "date-fns";

interface SalesMetrics {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  cashSales: number;
  cardSales: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
}

interface AdvancedReportingProps {
  storeId: string;
}

export const AdvancedReporting = ({ storeId }: AdvancedReportingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [reportType, setReportType] = useState("sales");

  useEffect(() => {
    if (user && storeId) {
      generateReport();
    }
  }, [user, storeId, dateRange, reportType]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "week":
        return { start: subDays(now, 7), end: now };
      case "month":
        return { start: subDays(now, 30), end: now };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const generateReport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Fetch sales data
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total,
          payment_method,
          created_at,
          order_items (
            quantity,
            product_id,
            total_price,
            products (
              name
            )
          )
        `)
        .eq("store_id", storeId)
        .eq("status", "completed")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (ordersError) throw ordersError;

      const orders = ordersData || [];

      // Calculate metrics
      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
      const totalTransactions = orders.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
      
      const cashSales = orders
        .filter(o => o.payment_method === 'cash')
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
      
      const cardSales = orders
        .filter(o => ['card', 'credit', 'debit'].includes(o.payment_method))
        .reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

      // Calculate top products
      const productSales: Record<string, { quantity: number; revenue: number }> = {};
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = (item.products as any)?.name || 'Unknown Product';
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity || 0;
          productSales[productName].revenue += parseFloat(item.total_price.toString());
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate hourly breakdown
      const hourlyData: Record<number, { sales: number; transactions: number }> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { sales: 0, transactions: 0 };
      }

      orders.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        hourlyData[hour].sales += parseFloat(order.total.toString());
        hourlyData[hour].transactions += 1;
      });

      const hourlyBreakdown = Object.entries(hourlyData)
        .map(([hour, data]) => ({ hour: parseInt(hour), ...data }));

      setMetrics({
        totalSales,
        totalTransactions,
        averageTicket,
        cashSales,
        cardSales,
        topProducts,
        hourlyBreakdown
      });

    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!metrics) return;

    try {
      const reportData = {
        storeId,
        dateRange,
        reportType,
        generatedAt: new Date().toISOString(),
        metrics
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Report has been saved to your downloads",
      });
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Generating report...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Reporting
          </CardTitle>
          <CardDescription>
            Detailed sales analytics and business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="products">Product Report</SelectItem>
                  <SelectItem value="hourly">Hourly Report</SelectItem>
                  <SelectItem value="payment">Payment Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={generateReport} disabled={loading} className="mt-6">
              <Filter className="h-4 w-4 mr-2" />
              Generate
            </Button>

            <Button onClick={downloadReport} variant="outline" className="mt-6">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.totalSales.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.totalTransactions}
                  </div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${metrics.averageTicket.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Ticket</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {metrics.totalTransactions > 0 ? 
                      ((metrics.cashSales / metrics.totalSales) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Cash %</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold">${metrics.cashSales.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Cash Sales</div>
                  <Badge variant="outline" className="mt-1">
                    {metrics.totalSales > 0 ? ((metrics.cashSales / metrics.totalSales) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">${metrics.cardSales.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Card Sales</div>
                  <Badge variant="outline" className="mt-1">
                    {metrics.totalSales > 0 ? ((metrics.cardSales / metrics.totalSales) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.quantity} units sold
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${product.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Hourly Sales Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.hourlyBreakdown
                  .filter(hour => hour.transactions > 0)
                  .map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">
                        {hour.hour.toString().padStart(2, '0')}:00 - {(hour.hour + 1).toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {hour.transactions} transactions
                        </span>
                        <span className="font-bold">
                          ${hour.sales.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};