import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, Clock, Target } from "lucide-react";

interface TrainingStatsCardsProps {
  stats: {
    totalProgress: number;
    completedModules: number;
    totalHours: number;
    currentStreak: number;
  };
  totalModules: number;
}

export const TrainingStatsCards = ({ stats, totalModules }: TrainingStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Overall Progress</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProgress}%</p>
              <Progress value={stats.totalProgress} className="mt-2" />
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Completed Modules</p>
              <p className="text-2xl font-bold text-foreground">{stats.completedModules}</p>
              <p className="text-sm text-success mt-1">of {totalModules} total</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <Award className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Training Hours</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalHours}h</p>
              <p className="text-sm text-primary mt-1">Time invested</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
              <p className="text-sm text-primary mt-1">Days in a row</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};