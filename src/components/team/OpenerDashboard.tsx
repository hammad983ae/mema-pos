import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Users, 
  Star,
  Target,
  Coffee,
  Sunrise
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";

interface OpenerMetrics {
  avgOpeningTime: string;
  onTimeOpenings: number;
  totalOpenings: number;
  customerGreetings: number;
  openingChecklist: number;
  teamCompatibility: number;
}

export const OpenerDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OpenerMetrics>({
    avgOpeningTime: "08:15",
    onTimeOpenings: 23,
    totalOpenings: 25,
    customerGreetings: 87,
    openingChecklist: 95,
    teamCompatibility: 8.5
  });
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchOpenerData();
    }
  }, [user]);

  const fetchOpenerData = async () => {
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

      // In a real app, fetch actual metrics from performance tracking
    } catch (error) {
      console.error("Error fetching opener data:", error);
    }
  };

  const onTimePercentage = (metrics.onTimeOpenings / metrics.totalOpenings) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Sunrise className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Opener Dashboard</h2>
          <p className="text-muted-foreground">Your opening performance and schedule</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(onTimePercentage)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.onTimeOpenings} of {metrics.totalOpenings} openings
            </p>
            <Progress value={onTimePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coffee className="h-4 w-4 text-orange-500" />
              Avg Opening Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgOpeningTime}</div>
            <p className="text-xs text-muted-foreground">
              Daily average this month
            </p>
            <Badge variant="secondary" className="mt-2">
              5 min early
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Customer Greetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customerGreetings}</div>
            <p className="text-xs text-muted-foreground">
              Average per opening shift
            </p>
            <Progress value={87} className="mt-2" />
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
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Sunrise className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Opening Shift</p>
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

      {/* Opening Checklist Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Opening Checklist Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { task: "Unlock & Disarm", completion: 100, time: "08:12" },
              { task: "Turn on Lights & Music", completion: 98, time: "08:13" },
              { task: "Check Cash Register", completion: 95, time: "08:15" },
              { task: "Review Daily Goals", completion: 92, time: "08:16" },
              { task: "Prepare Display Area", completion: 88, time: "08:18" },
              { task: "Brief Team Members", completion: 85, time: "08:20" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.task}</span>
                    <span className="text-xs text-muted-foreground">Avg: {item.time}</span>
                  </div>
                  <Progress value={item.completion} className="h-2" />
                </div>
                <div className="ml-3 text-sm font-medium">
                  {item.completion}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Compatibility Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Best Team Combinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Sarah (Upseller)", compatibility: 9.2, reason: "Complementary morning energy" },
              { name: "Mike (Upseller)", compatibility: 8.7, reason: "Similar customer approach" },
              { name: "Emma (Upseller)", compatibility: 8.4, reason: "Great communication flow" }
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