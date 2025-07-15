import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, Download } from "lucide-react";

export const InventoryReports = () => {
  const stockTurnoverData = [
    { category: "Serums", turnover: 4.2, value: 45200 },
    { category: "Moisturizers", turnover: 3.8, value: 38100 },
    { category: "Cleansers", turnover: 5.1, value: 28900 },
    { category: "Sun Protection", turnover: 2.9, value: 34500 },
    { category: "Night Care", turnover: 3.2, value: 42300 },
    { category: "Masks", turnover: 6.7, value: 18700 }
  ];

  const inventoryValueData = [
    { name: "Serums", value: 45200, color: "#8B5CF6" },
    { name: "Moisturizers", value: 38100, color: "#10B981" },
    { name: "Cleansers", value: 28900, color: "#F59E0B" },
    { name: "Sun Protection", value: 34500, color: "#EF4444" },
    { name: "Night Care", value: 42300, color: "#3B82F6" },
    { name: "Masks", value: 18700, color: "#6B7280" }
  ];

  const movementTrends = [
    { month: "Jul", inbound: 2400, outbound: 2100 },
    { month: "Aug", inbound: 1800, outbound: 2300 },
    { month: "Sep", inbound: 3200, outbound: 2800 },
    { month: "Oct", inbound: 2800, outbound: 3100 },
    { month: "Nov", inbound: 3400, outbound: 3300 },
    { month: "Dec", inbound: 2900, outbound: 3500 },
    { month: "Jan", inbound: 3800, outbound: 3200 }
  ];

  const topPerformers = [
    { name: "Vitamin C Serum", units: 1247, revenue: 57361, trend: "up" },
    { name: "Hyaluronic Moisturizer", units: 986, revenue: 37961, trend: "up" },
    { name: "Gentle Daily Cleanser", units: 834, revenue: 24166, trend: "down" },
    { name: "SPF 50 Sunscreen", units: 723, revenue: 25254, trend: "up" },
    { name: "Retinol Night Cream", units: 612, revenue: 37944, trend: "down" }
  ];

  const slowMovers = [
    { name: "Luxury Gold Mask", units: 23, daysInStock: 180, value: 2875 },
    { name: "Premium Eye Cream", units: 34, daysInStock: 165, value: 4250 },
    { name: "Anti-Aging Serum", units: 18, daysInStock: 142, value: 1980 },
    { name: "Brightening Toner", units: 45, daysInStock: 128, value: 1575 }
  ];

  const metrics = {
    totalValue: 287400,
    turnoverRate: 4.1,
    carryingCost: 8640,
    stockoutRate: 2.3
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-2xl font-bold text-foreground">${metrics.totalValue.toLocaleString()}</p>
                <p className="text-sm text-success mt-1">+12.3% from last month</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Turnover Rate</p>
                <p className="text-2xl font-bold text-foreground">{metrics.turnoverRate}x</p>
                <p className="text-sm text-success mt-1">+0.3x from last quarter</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Carrying Cost</p>
                <p className="text-2xl font-bold text-foreground">${metrics.carryingCost.toLocaleString()}</p>
                <p className="text-sm text-warning mt-1">+5.2% from last month</p>
              </div>
              <Package className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stockout Rate</p>
                <p className="text-2xl font-bold text-foreground">{metrics.stockoutRate}%</p>
                <p className="text-sm text-destructive mt-1">+0.5% from last month</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Turnover by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="h-5 w-5" />
              <span>Stock Turnover by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockTurnoverData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === "turnover" ? `${value}x` : `$${value.toLocaleString()}`, 
                    name === "turnover" ? "Turnover Rate" : "Inventory Value"
                  ]}
                />
                <Bar dataKey="turnover" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Inventory Value Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryValueData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryValueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Value"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stock Movement Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LineChart className="h-5 w-5" />
            <span>Stock Movement Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} units`, ""]} />
              <Line type="monotone" dataKey="inbound" stroke="hsl(var(--success))" strokeWidth={2} name="Inbound" />
              <Line type="monotone" dataKey="outbound" stroke="hsl(var(--primary))" strokeWidth={2} name="Outbound" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Top Performing Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${product.revenue.toLocaleString()}</p>
                    <div className="flex items-center space-x-1">
                      {product.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <Badge variant={product.trend === "up" ? "default" : "destructive"} className="text-xs">
                        {product.trend === "up" ? "Growing" : "Declining"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Slow Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Slow Moving Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slowMovers.map((product, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.units} units remaining</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ${product.value.toLocaleString()} value
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Days in stock</span>
                      <span className="font-medium">{product.daysInStock} days</span>
                    </div>
                    <Progress 
                      value={Math.min((product.daysInStock / 180) * 100, 100)} 
                      className="h-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Export Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generate detailed inventory reports for analysis and planning
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Turnover Report
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Valuation Report
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Complete Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};