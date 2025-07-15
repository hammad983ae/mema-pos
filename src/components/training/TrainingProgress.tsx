import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Trophy, 
  Clock, 
  Target,
  Award,
  Flame
} from "lucide-react";

interface UserProgress {
  module_id: string;
  completion_percentage: number;
  total_time_spent_seconds: number;
  sessions_count: number;
  average_score: number;
  best_score: number;
  streak_days: number;
}

interface TrainingProgressProps {
  progress: UserProgress[];
}

export const TrainingProgress = ({ progress }: TrainingProgressProps) => {
  const totalModules = progress.length;
  const completedModules = progress.filter(p => p.completion_percentage >= 100).length;
  const totalHours = progress.reduce((sum, p) => sum + p.total_time_spent_seconds, 0) / 3600;
  const totalSessions = progress.reduce((sum, p) => sum + p.sessions_count, 0);
  const maxStreak = Math.max(...progress.map(p => p.streak_days), 0);
  const avgScore = progress.length > 0 
    ? progress.reduce((sum, p) => sum + (p.average_score || 0), 0) / progress.length 
    : 0;

  const recentProgress = progress
    .filter(p => p.sessions_count > 0)
    .sort((a, b) => b.completion_percentage - a.completion_percentage)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="text-2xl font-bold text-primary">{completedModules}</div>
            <div className="text-xs text-muted-foreground">Modules Completed</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-success/5">
            <div className="text-2xl font-bold text-success">{Math.round(avgScore)}</div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-warning/5">
            <div className="text-2xl font-bold text-warning">{Math.round(totalHours * 10) / 10}h</div>
            <div className="text-xs text-muted-foreground">Training Time</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-warning/5">
            <div className="text-2xl font-bold text-warning">{maxStreak}</div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground flex items-center">
            <Award className="h-4 w-4 mr-2" />
            Recent Achievements
          </h4>
          
          <div className="space-y-2">
            {maxStreak >= 7 && (
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-warning/10">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-foreground">Week Warrior</span>
                <Badge variant="outline" className="text-xs">7+ day streak</Badge>
              </div>
            )}
            
            {completedModules >= 1 && (
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-success/10">
                <Trophy className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">First Victory</span>
                <Badge variant="outline" className="text-xs">Module completed</Badge>
              </div>
            )}
            
            {totalSessions >= 10 && (
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Dedicated Learner</span>
                <Badge variant="outline" className="text-xs">10+ sessions</Badge>
              </div>
            )}
            
            {progress.length === 0 && (
              <div className="text-center py-4">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Complete your first training session to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Module Progress */}
        {recentProgress.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recent Activity
            </h4>
            
            <div className="space-y-3">
              {recentProgress.map((item, index) => (
                <div key={item.module_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Module {index + 1}</span>
                    <span className="text-sm text-muted-foreground">{Math.round(item.completion_percentage)}%</span>
                  </div>
                  <Progress value={item.completion_percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.sessions_count} sessions</span>
                    <span>{Math.round(item.total_time_spent_seconds / 60)}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};