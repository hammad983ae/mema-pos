import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Clock, 
  Star, 
  Trophy,
  Brain,
  Target,
  Users,
  Zap,
  MessageSquare,
  ChevronRight
} from "lucide-react";

interface TrainingModule {
  id: string;
  name: string;
  description: string;
  module_type: string;
  difficulty_level: number;
  estimated_duration_minutes: number;
  is_active: boolean;
  display_order: number;
}

interface UserProgress {
  module_id: string;
  completion_percentage: number;
  total_time_spent_seconds: number;
  sessions_count: number;
  average_score: number;
  best_score: number;
  streak_days: number;
}

interface TrainingModuleCardProps {
  module: TrainingModule;
  progress?: UserProgress;
  onStart: () => void;
}

const getModuleIcon = (moduleType: string) => {
  const iconMap = {
    mindset: Brain,
    finding_why: Target,
    sample_approach: Users,
    connection_building: MessageSquare,
    objection_handling: Zap,
    closing_techniques: Trophy,
    opener_to_upseller: ChevronRight,
    high_pressure_tactics: Star,
    product_knowledge: Clock,
    customer_psychology: Brain
  };
  
  return iconMap[moduleType as keyof typeof iconMap] || Play;
};

const getModuleColor = (moduleType: string) => {
  const colorMap = {
    mindset: "bg-primary/10 text-primary border-primary/20",
    finding_why: "bg-primary-light/50 text-primary border-primary/20",
    sample_approach: "bg-success/10 text-success border-success/20",
    connection_building: "bg-warning/10 text-warning border-warning/20",
    objection_handling: "bg-destructive/10 text-destructive border-destructive/20",
    closing_techniques: "bg-primary-glow/30 text-primary border-primary/20",
    opener_to_upseller: "bg-accent/50 text-accent-foreground border-accent/30",
    high_pressure_tactics: "bg-primary-muted/50 text-primary border-primary/20",
    product_knowledge: "bg-success-glow/30 text-success border-success/20",
    customer_psychology: "bg-primary/15 text-primary border-primary/25"
  };
  
  return colorMap[moduleType as keyof typeof colorMap] || "bg-primary/10 text-primary border-primary/20";
};

const getDifficultyLabel = (level: number) => {
  const labels = {
    1: "Beginner",
    2: "Easy",
    3: "Intermediate", 
    4: "Advanced",
    5: "Expert"
  };
  
  return labels[level as keyof typeof labels] || "Unknown";
};

const getDifficultyColor = (level: number) => {
  const colors = {
    1: "bg-success/10 text-success border-success/20",
    2: "bg-primary-light/50 text-primary border-primary/20",
    3: "bg-warning/10 text-warning border-warning/20",
    4: "bg-warning-glow/30 text-warning border-warning/20", 
    5: "bg-destructive/10 text-destructive border-destructive/20"
  };
  
  return colors[level as keyof typeof colors] || "bg-muted text-muted-foreground";
};

export const TrainingModuleCard = ({ module, progress, onStart }: TrainingModuleCardProps) => {
  const Icon = getModuleIcon(module.module_type);
  const moduleColorClass = getModuleColor(module.module_type);
  const difficultyColorClass = getDifficultyColor(module.difficulty_level);
  
  const isCompleted = progress && progress.completion_percentage >= 100;
  const isStarted = progress && progress.sessions_count > 0;
  const completionPercentage = progress?.completion_percentage || 0;
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${moduleColorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {module.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>
          
          {isCompleted && (
            <div className="flex-shrink-0">
              <Badge className="bg-success/10 text-success border-success/20">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {isStarted && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        )}
        
        {/* Module Details */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{module.estimated_duration_minutes}m</span>
            </div>
            
            <Badge variant="outline" className={difficultyColorClass}>
              <Star className="h-3 w-3 mr-1" />
              {getDifficultyLabel(module.difficulty_level)}
            </Badge>
          </div>
          
          {progress && (
            <div className="flex items-center space-x-3 text-muted-foreground">
              {progress.sessions_count > 0 && (
                <div className="flex items-center space-x-1">
                  <Play className="h-4 w-4" />
                  <span>{progress.sessions_count} sessions</span>
                </div>
              )}
              
              {progress.best_score && (
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4" />
                  <span>{Math.round(progress.best_score)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <Button 
          onClick={onStart}
          className="w-full group-hover:shadow-md transition-all"
          variant={isCompleted ? "outline" : "default"}
        >
          <Play className="h-4 w-4 mr-2" />
          {isCompleted ? "Review Module" : isStarted ? "Continue Training" : "Start Training"}
        </Button>
        
        {/* Additional Stats for Started Modules */}
        {isStarted && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {Math.round((progress?.total_time_spent_seconds || 0) / 60)}m
              </div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {progress?.streak_days || 0}
              </div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};