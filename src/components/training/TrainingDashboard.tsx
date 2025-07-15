import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Award,
  Brain,
  BarChart3,
  Calendar,
  Trophy
} from "lucide-react";

interface TrainingMetrics {
  totalSessions: number;
  totalUsers: number;
  averageScore: number;
  completionRate: number;
  totalHours: number;
  activeModules: number;
  weeklyGrowth: number;
  topPerformers: Array<{
    user_id: string;
    user_name: string;
    total_score: number;
    sessions_count: number;
  }>;
  moduleStats: Array<{
    module_id: string;
    module_name: string;
    completion_count: number;
    average_score: number;
    total_sessions: number;
  }>;
  recentActivity: Array<{
    user_name: string;
    module_name: string;
    score: number;
    completed_at: string;
  }>;
}

export const TrainingDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    totalSessions: 0,
    totalUsers: 0,
    averageScore: 0,
    completionRate: 0,
    totalHours: 0,
    activeModules: 0,
    weeklyGrowth: 0,
    topPerformers: [],
    moduleStats: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTrainingMetrics();
    }
  }, [user]);

  const fetchTrainingMetrics = async () => {
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

      // Fetch overall session metrics with user names
      const { data: sessionMetrics } = await supabase
        .from("sales_training_sessions")
        .select(`
          id,
          total_duration_seconds,
          performance_score,
          completed_at,
          user_id,
          module_id
        `)
        .eq("business_id", membershipData.business_id)
        .eq("session_status", "completed");

      // Fetch user profiles for names
      const userIds = sessionMetrics?.map(s => s.user_id) || [];
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Fetch training modules for names
      const moduleIds = sessionMetrics?.map(s => s.module_id) || [];
      const { data: moduleProfiles } = await supabase
        .from("sales_training_modules")
        .select("id, name")
        .in("id", moduleIds);

      // Fetch module completion data
      const { data: progressData } = await supabase
        .from("sales_training_progress")
        .select(`
          completion_percentage,
          sessions_count,
          average_score,
          best_score,
          total_time_spent_seconds,
          user_id,
          module_id
        `)
        .eq("business_id", membershipData.business_id);

      // Fetch active modules count
      const { data: modulesData } = await supabase
        .from("sales_training_modules")
        .select("id")
        .eq("business_id", membershipData.business_id)
        .eq("is_active", true);

      // Calculate metrics
      const totalSessions = sessionMetrics?.length || 0;
      const uniqueUsers = new Set(sessionMetrics?.map(s => s.user_id)).size;
      const totalDurationSeconds = sessionMetrics?.reduce((sum, s) => sum + (s.total_duration_seconds || 0), 0) || 0;
      const averageScore = sessionMetrics?.length > 0 
        ? sessionMetrics.reduce((sum, s) => sum + (s.performance_score || 0), 0) / sessionMetrics.length 
        : 0;

      // Calculate completion rate
      const completedModules = progressData?.filter(p => p.completion_percentage >= 100).length || 0;
      const totalProgress = progressData?.length || 0;
      const completionRate = totalProgress > 0 ? (completedModules / totalProgress) * 100 : 0;

      // Create lookup maps for user and module names
      const userNameMap = new Map(userProfiles?.map(u => [u.user_id, u.full_name]) || []);
      const moduleNameMap = new Map(moduleProfiles?.map(m => [m.id, m.name]) || []);

      // Get top performers
      const userScores = new Map();
      progressData?.forEach(p => {
        if (!userScores.has(p.user_id)) {
          userScores.set(p.user_id, {
            user_id: p.user_id,
            user_name: userNameMap.get(p.user_id) || 'Unknown',
            total_score: 0,
            sessions_count: 0
          });
        }
        const user = userScores.get(p.user_id);
        user.total_score += p.average_score || 0;
        user.sessions_count += p.sessions_count || 0;
      });

      const topPerformers = Array.from(userScores.values())
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 5);

      // Get module statistics
      const moduleStats = new Map();
      progressData?.forEach(p => {
        if (!moduleStats.has(p.module_id)) {
          moduleStats.set(p.module_id, {
            module_id: p.module_id,
            module_name: moduleNameMap.get(p.module_id) || 'Unknown Module',
            completion_count: 0,
            total_score: 0,
            total_sessions: 0,
            participant_count: 0
          });
        }
        const module = moduleStats.get(p.module_id);
        if (p.completion_percentage >= 100) module.completion_count++;
        module.total_score += p.average_score || 0;
        module.total_sessions += p.sessions_count || 0;
        module.participant_count++;
      });

      const moduleStatsArray = Array.from(moduleStats.values()).map(m => ({
        ...m,
        average_score: m.participant_count > 0 ? m.total_score / m.participant_count : 0
      }));

      // Get recent activity (last 10 completed sessions)
      const recentActivity = sessionMetrics
        ?.filter(s => s.completed_at)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, 10)
        .map(s => ({
          user_name: userNameMap.get(s.user_id) || 'Unknown',
          module_name: moduleNameMap.get(s.module_id) || 'Unknown Module',
          score: s.performance_score || 0,
          completed_at: s.completed_at
        })) || [];

      setMetrics({
        totalSessions,
        totalUsers: uniqueUsers,
        averageScore: Math.round(averageScore),
        completionRate: Math.round(completionRate),
        totalHours: Math.round(totalDurationSeconds / 3600 * 10) / 10,
        activeModules: modulesData?.length || 0,
        weeklyGrowth: 15, // Placeholder - would need to calculate from historical data
        topPerformers,
        moduleStats: moduleStatsArray,
        recentActivity
      });

    } catch (error) {
      console.error("Error fetching training metrics:", error);
      toast({
        title: "Error",
        description: "Failed to load training analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalSessions}</p>
                <p className="text-sm text-success mt-1">+{metrics.weeklyGrowth}% this week</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{metrics.totalUsers}</p>
                <p className="text-sm text-primary mt-1">{metrics.activeModules} modules</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Average Score</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageScore}%</p>
                <p className="text-sm text-warning mt-1">{metrics.totalHours}h total</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <Target className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{metrics.completionRate}%</p>
                <Progress value={metrics.completionRate} className="mt-2" />
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <Award className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topPerformers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No performance data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.topPerformers.map((performer, index) => (
                  <div key={performer.user_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-warning text-warning-foreground' :
                        index === 1 ? 'bg-muted text-muted-foreground' :
                        index === 2 ? 'bg-warning/70 text-warning-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{performer.user_name}</p>
                        <p className="text-sm text-muted-foreground">{performer.sessions_count} sessions</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-bold">
                      {Math.round(performer.total_score)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Module Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.moduleStats.length === 0 ? (
              <div className="text-center py-6">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No module data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.moduleStats.slice(0, 5).map((module) => (
                  <div key={module.module_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">{module.module_name}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(module.average_score)}%</span>
                    </div>
                    <Progress value={module.average_score} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{module.completion_count} completed</span>
                      <span>{module.total_sessions} sessions</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{activity.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed {activity.module_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      activity.score >= 80 ? "bg-success/10 text-success border-success/20" :
                      activity.score >= 60 ? "bg-warning/10 text-warning border-warning/20" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    }>
                      {activity.score}%
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};