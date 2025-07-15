import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TrainingProgressData {
  module_id: string;
  completion_percentage: number;
  total_time_spent_seconds: number;
  sessions_count: number;
  average_score: number;
  best_score: number;
  streak_days: number;
  last_accessed_at: string;
}

export const useTrainingProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<TrainingProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  // Update progress after session completion
  const updateProgressAfterSession = async (
    moduleId: string, 
    sessionDuration: number, 
    score: number
  ) => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      // Get current progress
      const { data: currentProgress } = await supabase
        .from("sales_training_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("module_id", moduleId)
        .eq("business_id", membershipData.business_id)
        .maybeSingle();

      const newSessionsCount = (currentProgress?.sessions_count || 0) + 1;
      const newTotalTime = (currentProgress?.total_time_spent_seconds || 0) + sessionDuration;
      const newCompletionPercentage = Math.min((currentProgress?.completion_percentage || 0) + 15, 100);
      
      // Calculate new average score
      const currentAverage = currentProgress?.average_score || 0;
      const newAverageScore = currentProgress 
        ? ((currentAverage * (newSessionsCount - 1)) + score) / newSessionsCount
        : score;

      // Calculate streak
      const lastSessionDate = currentProgress?.last_accessed_at ? 
        new Date(currentProgress.last_accessed_at) : null;
      const today = new Date();
      const isConsecutiveDay = lastSessionDate && 
        Math.abs(today.getTime() - lastSessionDate.getTime()) <= 24 * 60 * 60 * 1000;
      
      const newStreak = isConsecutiveDay ? 
        (currentProgress?.streak_days || 0) + 1 : 1;

      const progressData = {
        user_id: user.id,
        business_id: membershipData.business_id,
        module_id: moduleId,
        completion_percentage: newCompletionPercentage,
        total_time_spent_seconds: newTotalTime,
        sessions_count: newSessionsCount,
        average_score: Math.round(newAverageScore),
        best_score: Math.max(currentProgress?.best_score || 0, score),
        streak_days: newStreak,
        last_accessed_at: new Date().toISOString()
      };

      if (currentProgress) {
        await supabase
          .from("sales_training_progress")
          .update(progressData)
          .eq("id", currentProgress.id);
      } else {
        await supabase
          .from("sales_training_progress")
          .insert(progressData);
      }

      // Show achievement notifications
      if (newCompletionPercentage === 100 && currentProgress?.completion_percentage < 100) {
        toast({
          title: "🎉 Module Completed!",
          description: "Great job! You've mastered this training module.",
        });
      }

      if (newStreak === 7) {
        toast({
          title: "🔥 Week Warrior!",
          description: "7 days of consistent training! Keep it up!",
        });
      }

      if (score >= 90) {
        toast({
          title: "⭐ Excellent Performance!",
          description: `Outstanding score of ${score}%!`,
        });
      }

      // Refresh progress data
      await fetchProgress();
      
    } catch (error) {
      console.error("Error updating training progress:", error);
      toast({
        title: "Error",
        description: "Failed to save your progress",
        variant: "destructive",
      });
    }
  };

  const fetchProgress = async () => {
    if (!user) return;

    try {
      const { data: membershipData } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membershipData) return;

      const { data: progressData, error } = await supabase
        .from("sales_training_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", membershipData.business_id)
        .order("last_accessed_at", { ascending: false });

      if (error) throw error;

      setProgress(progressData || []);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('training-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_training_progress',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Training progress update:', payload);
          fetchProgress(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    progress,
    loading,
    updateProgressAfterSession,
    fetchProgress
  };
};