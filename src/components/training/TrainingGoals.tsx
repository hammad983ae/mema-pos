import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Plus, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Calendar
} from "lucide-react";

interface TrainingGoal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  target_date: string | null;
  description: string;
  is_achieved: boolean;
  created_by: string;
}

export const TrainingGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
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

      // Fetch user's training goals
      const { data: goalsData, error } = await supabase
        .from("sales_training_goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", membershipData.business_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setGoals(goalsData || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to load training goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGoalTypeLabel = (goalType: string) => {
    const labels = {
      weekly_hours: "Weekly Hours",
      module_completion: "Module Completion",
      skill_improvement: "Skill Improvement",
      daily_practice: "Daily Practice",
      monthly_target: "Monthly Target"
    };
    
    return labels[goalType as keyof typeof labels] || goalType;
  };

  const getGoalIcon = (goalType: string) => {
    const icons = {
      weekly_hours: Clock,
      module_completion: Target,
      skill_improvement: TrendingUp,
      daily_practice: Calendar,
      monthly_target: CheckCircle
    };
    
    return icons[goalType as keyof typeof icons] || Target;
  };

  const getProgressPercentage = (goal: TrainingGoal) => {
    if (goal.target_value === 0) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getTimeUntilDeadline = (targetDate: string | null) => {
    if (!targetDate) return null;
    
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `${diffDays} days left`;
  };

  const createDefaultGoals = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const defaultGoals = [
        {
          user_id: user.id,
          business_id: membershipData.business_id,
          goal_type: "weekly_hours",
          target_value: 5,
          current_value: 0,
          description: "Complete 5 hours of training per week",
          created_by: user.id,
          target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
          user_id: user.id,
          business_id: membershipData.business_id,
          goal_type: "module_completion",
          target_value: 1,
          current_value: 0,
          description: "Complete 1 training module this month",
          created_by: user.id,
          target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ];

      const { error } = await supabase
        .from("sales_training_goals")
        .insert(defaultGoals);

      if (error) throw error;

      await fetchGoals();
      
      toast({
        title: "Goals Created!",
        description: "Default training goals have been set up for you.",
      });
    } catch (error) {
      console.error("Error creating default goals:", error);
      toast({
        title: "Error",
        description: "Failed to create default goals",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Training Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Training Goals
          </div>
          {goals.length === 0 && (
            <Button size="sm" variant="outline" onClick={createDefaultGoals}>
              <Plus className="h-4 w-4 mr-1" />
              Setup
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Goals Set</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set training goals to track your progress and stay motivated.
            </p>
            <Button onClick={createDefaultGoals} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Default Goals
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const GoalIcon = getGoalIcon(goal.goal_type);
              const progressPercentage = getProgressPercentage(goal);
              const timeLeft = getTimeUntilDeadline(goal.target_date);
              
              return (
                <div key={goal.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GoalIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {getGoalTypeLabel(goal.goal_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      {goal.is_achieved ? (
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Achieved
                        </Badge>
                      ) : (
                        timeLeft && (
                          <Badge variant="outline" className="text-xs">
                            {timeLeft}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {goal.current_value} / {goal.target_value}
                        {goal.goal_type === "weekly_hours" ? "h" : ""}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progressPercentage)}% complete
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Custom goal creation will be available soon!",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Goal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};