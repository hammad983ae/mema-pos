import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { 
  Brain, 
  MessageSquare, 
  Target, 
  TrendingUp, 
  Play, 
  BookOpen,
  Award,
  Clock,
  Zap
} from "lucide-react";
import { SalesTrainingChat } from "@/components/training/SalesTrainingChat";
import { ResistanceHandlingChat } from "@/components/training/ResistanceHandlingChat";
import { CocosSalesTraining } from "@/components/training/CocosSalesTraining";
import { TrainingModuleCard } from "@/components/training/TrainingModuleCard";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { TrainingGoals } from "@/components/training/TrainingGoals";
import { TrainingStatsCards } from "@/components/training/TrainingStatsCards";
import { QuickStartCard } from "@/components/training/QuickStartCard";
import { TrainingErrorBoundary } from "@/components/training/TrainingErrorBoundary";

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

const SalesTraining = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { withErrorHandling } = useErrorHandler();
  const { measureAsync } = usePerformanceMonitor('SalesTraining');
  
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [activeModule, setActiveModule] = useState<TrainingModule | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProgress: 0,
    completedModules: 0,
    totalHours: 0,
    currentStreak: 0
  });

  useEffect(() => {
    if (user) {
      fetchTrainingData();
    }
    // Cleanup function to prevent memory leaks
    return () => {
      setModules([]);
      setUserProgress([]);
    };
  }, [user]);

  const fetchTrainingData = withErrorHandling(async () => {
    if (!user) return;

    await measureAsync('fetchTrainingData', async () => {
      setLoading(true);

    // Get user's business context with optimized query
    const { data: membershipData } = await supabase
      .from("user_business_memberships")
      .select("business_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!membershipData) {
      throw new Error("User not associated with any business");
    }

    // Fetch training modules with selective fields
    const { data: modulesData, error: modulesError } = await supabase
      .from("sales_training_modules")
      .select("id, name, description, module_type, difficulty_level, estimated_duration_minutes, is_active, display_order")
      .eq("business_id", membershipData.business_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(20);

    if (modulesError) throw modulesError;

    // Fetch user progress with selective fields
    const { data: progressData, error: progressError } = await supabase
      .from("sales_training_progress")
      .select("module_id, completion_percentage, total_time_spent_seconds, sessions_count, average_score, best_score, streak_days")
      .eq("user_id", user.id)
      .eq("business_id", membershipData.business_id);

    if (progressError) throw progressError;

    setModules(modulesData || []);
    setUserProgress(progressData || []);

    // Calculate stats
    const totalModules = modulesData?.length || 0;
    const completedModules = progressData?.filter(p => p.completion_percentage >= 100).length || 0;
    const totalSeconds = progressData?.reduce((sum, p) => sum + p.total_time_spent_seconds, 0) || 0;
    const avgProgress = progressData?.length > 0 
      ? progressData.reduce((sum, p) => sum + p.completion_percentage, 0) / progressData.length 
      : 0;
    const maxStreak = Math.max(...(progressData?.map(p => p.streak_days) || [0]));

    setStats({
      totalProgress: Math.round(avgProgress),
      completedModules,
      totalHours: Math.round(totalSeconds / 3600 * 10) / 10,
      currentStreak: maxStreak
    });

      setLoading(false);
    });
  }, 'SalesTraining.fetchTrainingData');

  const handleStartTraining = (module: TrainingModule) => {
    setActiveModule(module);
    setShowChat(true);
  };

  const getModuleProgress = (moduleId: string) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your training program...</p>
        </div>
      </div>
    );
  }

  if (showChat) {
    if (activeModule) {
      return (
        <TrainingErrorBoundary>
          <SalesTrainingChat 
            module={activeModule}
            onBack={() => setShowChat(false)}
            onComplete={() => {
              setShowChat(false);
              fetchTrainingData();
            }}
          />
        </TrainingErrorBoundary>
      );
    } else {
      return (
        <TrainingErrorBoundary>
          <ResistanceHandlingChat 
            onBack={() => setShowChat(false)} 
          />
        </TrainingErrorBoundary>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Sales Training</h1>
              <p className="text-sm text-muted-foreground">Master high-pressure sales techniques</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Overview */}
        <TrainingStatsCards 
          stats={stats} 
          totalModules={modules.length} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training Modules */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Training Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {modules.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Training Modules Yet</h3>
                    <p className="text-muted-foreground">Training modules will be available once content is uploaded.</p>
                  </div>
                ) : (
                  modules.map((module) => (
                    <TrainingModuleCard
                      key={module.id}
                      module={module}
                      progress={getModuleProgress(module.id)}
                      onStart={() => handleStartTraining(module)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TrainingProgress progress={userProgress} />
            <TrainingGoals />
            
            {/* Quick Start */}
            <QuickStartCard
              modules={modules}
              userProgress={userProgress}
              onStartTraining={handleStartTraining}
              onResistanceTraining={() => setShowChat(true)}
            />
            
            {/* Cocos Sales Training */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Complete Sales Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CocosSalesTraining />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTraining;