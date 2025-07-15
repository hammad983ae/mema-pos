import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Plus,
  BookOpen,
  BarChart3
} from "lucide-react";

interface TrainingAnalyticsProps {
  businessId: string;
}

interface EmployeeProgress {
  user_id: string;
  employee_name: string;
  total_sessions: number;
  total_time_minutes: number;
  modules_completed: number;
  total_modules: number;
  average_score: number;
  last_activity: string;
  current_streak: number;
}

interface ModuleAnalytics {
  module_id: string;
  module_name: string;
  total_sessions: number;
  completion_rate: number;
  average_score: number;
  average_duration: number;
}

export const TrainingAnalytics = ({ businessId }: TrainingAnalyticsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employeeProgress, setEmployeeProgress] = useState<EmployeeProgress[]>([]);
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    user_id: "",
    goal_type: "",
    target_value: "",
    target_date: "",
    description: ""
  });

  useEffect(() => {
    if (businessId) {
      fetchAnalytics();
    }
  }, [businessId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch employee progress data
      const { data: progressData, error: progressError } = await supabase
        .from('sales_training_progress')
        .select(`
          user_id,
          total_time_spent_seconds,
          sessions_count,
          completion_percentage,
          streak_days,
          last_accessed_at,
          sales_training_modules!inner(name),
          profiles!inner(full_name)
        `)
        .eq('business_id', businessId);

      if (progressError) throw progressError;

      // Process and aggregate employee data
      const employeeMap = new Map();
      progressData?.forEach((progress: any) => {
        const userId = progress.user_id;
        if (!employeeMap.has(userId)) {
          employeeMap.set(userId, {
            user_id: userId,
            employee_name: progress.profiles?.full_name || 'Unknown',
            total_sessions: 0,
            total_time_minutes: 0,
            modules_completed: 0,
            total_modules: 0,
            average_score: 0,
            last_activity: progress.last_accessed_at,
            current_streak: progress.streak_days || 0
          });
        }
        
        const employee = employeeMap.get(userId);
        employee.total_sessions += progress.sessions_count || 0;
        employee.total_time_minutes += Math.round((progress.total_time_spent_seconds || 0) / 60);
        employee.total_modules += 1;
        if (progress.completion_percentage >= 100) {
          employee.modules_completed += 1;
        }
      });

      setEmployeeProgress(Array.from(employeeMap.values()));

      // Fetch module analytics
      const { data: moduleData, error: moduleError } = await supabase
        .from('sales_training_modules')
        .select(`
          id,
          name,
          sales_training_progress(
            completion_percentage,
            sessions_count,
            total_time_spent_seconds
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (moduleError) throw moduleError;

      const moduleStats = moduleData?.map((module: any) => {
        const progress = module.sales_training_progress || [];
        const totalUsers = progress.length;
        const completedUsers = progress.filter((p: any) => p.completion_percentage >= 100).length;
        const totalSessions = progress.reduce((sum: number, p: any) => sum + (p.sessions_count || 0), 0);
        const avgDuration = progress.length > 0 
          ? progress.reduce((sum: number, p: any) => sum + (p.total_time_spent_seconds || 0), 0) / progress.length / 60
          : 0;

        return {
          module_id: module.id,
          module_name: module.name,
          total_sessions: totalSessions,
          completion_rate: totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
          average_score: 85, // Placeholder
          average_duration: avgDuration
        };
      }) || [];

      setModuleAnalytics(moduleStats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load training analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      const { error } = await supabase
        .from('sales_training_goals')
        .insert({
          user_id: newGoal.user_id,
          business_id: businessId,
          goal_type: newGoal.goal_type,
          target_value: parseFloat(newGoal.target_value),
          target_date: newGoal.target_date,
          description: newGoal.description,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Training goal created successfully"
      });

      setNewGoal({
        user_id: "",
        goal_type: "",
        target_value: "",
        target_date: "",
        description: ""
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create training goal",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const totalEmployees = employeeProgress.length;
  const activeEmployees = employeeProgress.filter(emp => 
    emp.last_activity && new Date(emp.last_activity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const avgCompletionRate = employeeProgress.length > 0 
    ? employeeProgress.reduce((sum, emp) => sum + (emp.modules_completed / emp.total_modules * 100), 0) / employeeProgress.length
    : 0;
  const totalTrainingHours = employeeProgress.reduce((sum, emp) => sum + emp.total_time_minutes, 0) / 60;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active This Week</p>
                <p className="text-2xl font-bold">{activeEmployees}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Training Hours</p>
                <p className="text-2xl font-bold">{totalTrainingHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employee Progress</TabsTrigger>
          <TabsTrigger value="modules">Module Analytics</TabsTrigger>
          <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Training Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeProgress.map((employee) => (
                  <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{employee.employee_name}</h4>
                        <Badge variant="outline">
                          {employee.modules_completed}/{employee.total_modules} modules
                        </Badge>
                        {employee.current_streak > 0 && (
                          <Badge variant="secondary">
                            🔥 {employee.current_streak} day streak
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Progress 
                          value={(employee.modules_completed / employee.total_modules) * 100} 
                          className="h-2"
                        />
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{employee.total_sessions} sessions</span>
                          <span>{employee.total_time_minutes} minutes</span>
                          <span>Last active: {employee.last_activity ? new Date(employee.last_activity).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Module Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moduleAnalytics.map((module) => (
                  <div key={module.module_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{module.module_name}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Completion Rate</p>
                          <p className="font-medium">{module.completion_rate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Sessions</p>
                          <p className="font-medium">{module.total_sessions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Duration</p>
                          <p className="font-medium">{module.average_duration.toFixed(0)} min</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Training Goals
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Set Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Training Goal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="employee">Employee</Label>
                        <Select value={newGoal.user_id} onValueChange={(value) => setNewGoal({...newGoal, user_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeProgress.map((emp) => (
                              <SelectItem key={emp.user_id} value={emp.user_id}>
                                {emp.employee_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="goal-type">Goal Type</Label>
                        <Select value={newGoal.goal_type} onValueChange={(value) => setNewGoal({...newGoal, goal_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select goal type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly_hours">Weekly Training Hours</SelectItem>
                            <SelectItem value="module_completion">Module Completion</SelectItem>
                            <SelectItem value="skill_improvement">Skill Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="target">Target Value</Label>
                        <Input
                          id="target"
                          type="number"
                          value={newGoal.target_value}
                          onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                          placeholder="e.g., 10 hours or 5 modules"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Target Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newGoal.target_date}
                          onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newGoal.description}
                          onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                          placeholder="Goal description and expectations..."
                        />
                      </div>
                      <Button onClick={createGoal} className="w-full">
                        Create Goal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No training goals set yet. Create goals to track team progress.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};