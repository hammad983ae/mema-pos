import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const dailyData = [
  { day: "Mon", revenue: 15400, transactions: 142, customers: 128 },
  { day: "Tue", revenue: 18200, transactions: 156, customers: 145 },
  { day: "Wed", revenue: 16800, transactions: 148, customers: 134 },
  { day: "Thu", revenue: 19600, transactions: 167, customers: 152 },
  { day: "Fri", revenue: 22400, transactions: 189, customers: 171 },
  { day: "Sat", revenue: 28900, transactions: 234, customers: 198 },
  { day: "Sun", revenue: 24600, transactions: 201, customers: 176 },
];

const weeklyData = [
  { week: "Week 1", revenue: 142000, avgOrder: 98.50, conversion: 65.2 },
  { week: "Week 2", revenue: 156000, avgOrder: 102.30, conversion: 68.4 },
  { week: "Week 3", revenue: 148000, avgOrder: 95.80, conversion: 63.7 },
  { week: "Week 4", revenue: 168000, avgOrder: 105.60, conversion: 71.2 },
];

const monthlyData = [
  { month: "Jan", revenue: 580000, growth: 12.5 },
  { month: "Feb", revenue: 620000, growth: 15.2 },
  { month: "Mar", revenue: 645000, growth: 8.8 },
  { month: "Apr", revenue: 690000, growth: 18.9 },
  { month: "May", revenue: 735000, growth: 22.1 },
  { month: "Jun", revenue: 780000, growth: 25.4 },
];

const productData = [
  { product: "Vitamin C Serum", sales: 2840, revenue: 28400 },
  { product: "Hydrating Cleanser", sales: 2156, revenue: 21560 },
  { product: "Night Moisturizer", sales: 1890, revenue: 18900 },
  { product: "SPF 50 Sunscreen", sales: 1645, revenue: 16450 },
  { product: "Retinol Treatment", sales: 1230, revenue: 12300 },
];

interface SalesChartsProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const SalesCharts = ({ dateRange, selectedStore }: SalesChartsProps) => {
  return (
    <div className="space-y-6">
      {/* Time-based Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
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
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="product" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
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
                  dataKey="conversion" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--warning))", strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgOrder" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};