import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Users, 
  Star,
  Target,
  Award,
  Zap
} from "lucide-react";
import { format } from "date-fns";

interface UpsellerMetrics {
  upsellRate: number;
  avgTicketIncrease: number;
  customerSatisfaction: number;
  salesGoalProgress: number;
  teamCompatibility: number;
  thisMonthSales: number;
  goalAmount: number;
}

export const UpsellerDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UpsellerMetrics>({
    upsellRate: 68,
    avgTicketIncrease: 32,
    customerSatisfaction: 94,
    salesGoalProgress: 78,
    teamCompatibility: 9.1,
    thisMonthSales: 12450,
    goalAmount: 15000
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchUpsellerData();
    }
  }, [user]);

  const fetchUpsellerData = async () => {
    try {
      // Fetch today's schedule
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: schedule } = await supabase
        .from("employee_schedules")
        .select(`
          *,
          stores(name)
        `)
        .eq("user_id", user.id)
        .eq("schedule_date", today);

      setTodaySchedule(schedule || []);

      // In a real app, fetch actual metrics from sales performance tracking
    } catch (error) {
      console.error("Error fetching upseller data:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100">
          <TrendingUp className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Upseller Dashboard</h2>
          <p className="text-muted-foreground">Your sales performance and insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Upsell Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upsellRate}%</div>
            <p className="text-xs text-muted-foreground">
              Above team average (+12%)
            </p>
            <Progress value={metrics.upsellRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Avg Ticket Increase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgTicketIncrease}</div>
            <p className="text-xs text-muted-foreground">
              Per successful upsell
            </p>
            <Badge variant="default" className="mt-2">
              +15% vs last month
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerSatisfaction}%</div>
            <p className="text-xs text-muted-foreground">
              Based on feedback scores
            </p>
            <Progress value={metrics.customerSatisfaction} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-500" />
              Team Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.teamCompatibility}/10</div>
            <p className="text-xs text-muted-foreground">
              AI-calculated team synergy
            </p>
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= metrics.teamCompatibility
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Monthly Sales Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold">${metrics.thisMonthSales.toLocaleString()}</p>
                <p className="text-muted-foreground">Current month sales</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">${metrics.goalAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Monthly goal</p>
              </div>
            </div>
            <Progress value={metrics.salesGoalProgress} className="h-3" />
            <div className="flex justify-between text-sm">
              <span>{metrics.salesGoalProgress}% completed</span>
              <span>${(metrics.goalAmount - metrics.thisMonthSales).toLocaleString()} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaySchedule.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No shifts scheduled for today
            </p>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Sales Shift</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`2000-01-01T${shift.start_time}`), 'h:mm a')} - 
                        {format(new Date(`2000-01-01T${shift.end_time}`), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{shift.stores?.name}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {shift.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upselling Techniques Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Upselling Techniques Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { technique: "Product Bundling", successRate: 82, avgIncrease: "$45" },
              { technique: "Service Add-ons", successRate: 76, avgIncrease: "$28" },
              { technique: "Premium Upgrades", successRate: 65, avgIncrease: "$62" },
              { technique: "Complementary Items", successRate: 71, avgIncrease: "$23" },
              { technique: "Seasonal Promotions", successRate: 58, avgIncrease: "$38" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.technique}</span>
                    <span className="text-xs text-muted-foreground">Avg: {item.avgIncrease}</span>
                  </div>
                  <Progress value={item.successRate} className="h-2" />
                </div>
                <div className="ml-3 text-sm font-medium">
                  {item.successRate}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Opening Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Best Opening Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Alex (Opener)", compatibility: 9.5, reason: "Creates perfect energy transition" },
              { name: "Jordan (Opener)", compatibility: 8.9, reason: "Excellent customer handoffs" },
              { name: "Taylor (Opener)", compatibility: 8.6, reason: "Maintains sales momentum" }
            ].map((partner, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{partner.name}</p>
                  <p className="text-xs text-muted-foreground">{partner.reason}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{partner.compatibility}/10</div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                      <Star
                        key={star}
                        className={`h-2 w-2 ${
                          star <= partner.compatibility
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
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