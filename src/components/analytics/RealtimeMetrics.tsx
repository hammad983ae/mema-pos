import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Store } from "lucide-react";
import { useEffect, useState } from "react";

interface MetricData {
  label: string;
  value: string;
  change: number;
  icon: any;
  trend: "up" | "down";
}

interface RealtimeMetricsProps {
  analyticsData: {
    totalRevenue: number;
    totalTransactions: number;
    activeStores: number;
    teamPerformance: number;
  };
}

export const RealtimeMetrics = ({ analyticsData }: RealtimeMetricsProps) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);

  useEffect(() => {
    const updatedMetrics = [
      {
        label: "Total Revenue",
        value: `$${analyticsData.totalRevenue.toLocaleString()}`,
        change: Math.random() * 20 - 5, // Simulated change %
        icon: DollarSign,
        trend: analyticsData.totalRevenue > 10000 ? "up" : "down"
      },
      {
        label: "Total Transactions",
        value: analyticsData.totalTransactions.toString(),
        change: Math.random() * 15 - 3,
        icon: ShoppingCart,
        trend: analyticsData.totalTransactions > 50 ? "up" : "down"
      },
      {
        label: "Avg Order Value",
        value: analyticsData.totalTransactions > 0 
          ? `$${(analyticsData.totalRevenue / analyticsData.totalTransactions).toFixed(2)}`
          : "$0.00",
        change: Math.random() * 10 - 2,
        icon: Users,
        trend: "up"
      },
      {
        label: "Active Stores",
        value: analyticsData.activeStores.toString(),
        change: 0,
        icon: Store,
        trend: "up"
      }
    ] as MetricData[];

    setMetrics(updatedMetrics);
  }, [analyticsData]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        change: metric.change + (Math.random() - 0.5) * 0.2
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = metric.change > 0;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </p>
                  </div>
                </div>
                
                <Badge 
                  variant={isPositive ? "default" : "destructive"}
                  className="flex items-center space-x-1"
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(metric.change).toFixed(1)}%</span>
                </Badge>
              </div>
              
              {/* Animated pulse indicator */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full animate-pulse" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};