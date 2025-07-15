import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Users, 
  Award, 
  Target
} from "lucide-react";

interface TeamPerformanceProps {
  userRole: string;
}

export const TeamPerformance = ({ userRole }: TeamPerformanceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    teamStats: {
      totalMembers: 0,
      avgPerformance: 85,
      topPerformer: "Sarah J.",
      monthlyGrowth: 12,
    },
    leaderboard: [],
    performanceTrends: [],
    rolePerformance: [],
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.teamStats.avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">vs target this month</p>
            <div className="mt-4">
              <Progress value={performanceData.teamStats.avgPerformance} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Trophy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.teamStats.topPerformer}</div>
            <p className="text-xs text-muted-foreground">Top performer this month</p>
            <div className="flex items-center mt-2">
              <Star className="h-3 w-3 text-warning mr-1" />
              <span className="text-xs">{performanceData.teamStats.monthlyGrowth}% growth this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">active team members</p>
            <div className="flex items-center mt-2">
              <div className="w-2 h-2 bg-success rounded-full mr-2" />
              <span className="text-xs">22 online today</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};