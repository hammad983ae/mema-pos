import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin, TrendingUp, TrendingDown, Users, DollarSign, Eye } from "lucide-react";

const storeData = [
  {
    id: "store-001",
    name: "Downtown Flagship",
    location: "New York, NY",
    manager: "Sarah Johnson",
    revenue: 28420,
    target: 25000,
    transactions: 234,
    customers: 198,
    avgOrder: 121.45,
    performance: 113.7,
    trend: "up",
    status: "online"
  },
  {
    id: "store-002", 
    name: "Beverly Hills Spa",
    location: "Beverly Hills, CA",
    manager: "Michael Chen",
    revenue: 24890,
    target: 28000,
    transactions: 198,
    customers: 167,
    avgOrder: 125.70,
    performance: 88.9,
    trend: "down",
    status: "online"
  },
  {
    id: "store-003",
    name: "SoHo Boutique",
    location: "New York, NY", 
    manager: "Emma Davis",
    revenue: 22650,
    target: 22000,
    transactions: 189,
    customers: 156,
    avgOrder: 119.84,
    performance: 103.0,
    trend: "up",
    status: "online"
  },
  {
    id: "store-004",
    name: "Malibu Wellness",
    location: "Malibu, CA",
    manager: "James Wilson",
    revenue: 19890,
    target: 20000,
    transactions: 167,
    customers: 142,
    avgOrder: 119.10,
    performance: 99.5,
    trend: "up",
    status: "offline"
  },
  {
    id: "store-005",
    name: "Union Square",
    location: "San Francisco, CA",
    manager: "Lisa Rodriguez",
    revenue: 18420,
    target: 19000,
    transactions: 156,
    customers: 134,
    avgOrder: 118.08,
    performance: 97.0,
    trend: "down",
    status: "online"
  }
];

const regionData = [
  { region: "New York", stores: 45, revenue: 485000, performance: 108.2 },
  { region: "California", stores: 38, revenue: 425000, performance: 102.5 },
  { region: "Florida", stores: 28, revenue: 315000, performance: 95.8 },
  { region: "Texas", stores: 32, revenue: 368000, performance: 98.4 },
  { region: "Illinois", stores: 22, revenue: 285000, performance: 104.1 },
];

interface StorePerformanceProps {
  dateRange: { from: Date; to: Date };
  selectedStore: string;
}

export const StorePerformance = ({ dateRange, selectedStore }: StorePerformanceProps) => {
  return (
    <div className="space-y-6">
      {/* Regional Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" />
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
        </CardContent>
      </Card>

      {/* Store Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Performance Leaderboard</CardTitle>
          <Badge variant="outline">Today's Rankings</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {storeData.map((store, index) => (
              <div key={store.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${index < 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{store.name}</h3>
                        <Badge 
                          variant={store.status === 'online' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {store.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {store.location} • {store.manager}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">${store.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Target: ${store.target.toLocaleString()}
                      </p>
                    </div>
                    
                    <Badge 
                      variant={store.performance >= 100 ? "default" : "secondary"}
                      className={`
                        flex items-center space-x-1
                        ${store.performance >= 100 ? 'bg-success text-success-foreground' : ''}
                      `}
                    >
                      {store.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{store.performance}%</span>
                    </Badge>
                    
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <Progress 
                    value={Math.min(store.performance, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Store Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">${store.avgOrder}</p>
                      <p className="text-xs text-muted-foreground">Avg Order</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{store.customers}</p>
                      <p className="text-xs text-muted-foreground">Customers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{store.transactions}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};