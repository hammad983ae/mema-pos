-- Sales Training System Database Schema

-- Sales training modules (main training categories)
CREATE TABLE public.sales_training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'mindset', 'objection_handling', 'closing', 'connection', 'approach', 'opener_to_upseller', 'goal_setting', 'why_discovery'
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  language_code TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Sales training content (individual lessons/materials within modules)
CREATE TABLE public.sales_training_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'text', 'video', 'audio', 'pdf', 'interactive'
  content_text TEXT, -- For text-based content
  content_url TEXT, -- For media files
  ai_prompts JSONB, -- Specific AI prompts for this content
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
  estimated_duration_minutes INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  language_code TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI training conversations and sessions
CREATE TABLE public.sales_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.sales_training_modules(id),
  content_id UUID REFERENCES public.sales_training_content(id),
  session_type TEXT NOT NULL, -- 'practice', 'assessment', 'roleplay', 'chat'
  scenario TEXT, -- Specific scenario being practiced
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  ai_feedback JSONB, -- AI assessment and feedback
  performance_score INTEGER, -- 1-100 score
  areas_improved TEXT[],
  areas_to_work_on TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual messages within training sessions
CREATE TABLE public.sales_training_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sales_training_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'user', 'ai'
  message_content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'audio', 'image'
  ai_analysis JSONB, -- AI analysis of user's response
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User progress tracking
CREATE TABLE public.sales_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.sales_training_content(id),
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  best_score INTEGER, -- Best performance score achieved
  attempts_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id, content_id)
);

-- Sales goals and tracking
CREATE TABLE public.sales_training_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'daily_practice', 'module_completion', 'skill_improvement', 'personal_why'
  goal_description TEXT NOT NULL,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  target_date DATE,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused', 'abandoned'
  personal_why TEXT, -- User's personal motivation
  accountability_partner UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements and badges
CREATE TABLE public.sales_training_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL, -- 'module_master', 'streak_keeper', 'quick_learner', 'objection_crusher', etc.
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  icon_name TEXT, -- Lucide icon name
  earned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  points_earned INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_training_modules_business_language ON public.sales_training_modules(business_id, language_code);
CREATE INDEX idx_training_content_module ON public.sales_training_content(module_id);
CREATE INDEX idx_training_sessions_user_business ON public.sales_training_sessions(user_id, business_id);
CREATE INDEX idx_training_progress_user_module ON public.sales_training_progress(user_id, module_id);
CREATE INDEX idx_training_goals_user_status ON public.sales_training_goals(user_id, status);

-- Enable RLS
ALTER TABLE public.sales_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_training_modules
CREATE POLICY "Business members can view training modules" 
ON public.sales_training_modules FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage training modules" 
ON public.sales_training_modules FOR ALL 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for sales_training_content
CREATE POLICY "Business members can view training content" 
ON public.sales_training_content FOR SELECT 
USING (module_id IN (
  SELECT id FROM public.sales_training_modules 
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "Managers can manage training content" 
ON public.sales_training_content FOR ALL 
USING (module_id IN (
  SELECT id FROM public.sales_training_modules 
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
  )
));

-- RLS Policies for sales_training_sessions
CREATE POLICY "Users can view their own training sessions" 
ON public.sales_training_sessions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own training sessions" 
ON public.sales_training_sessions FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own training sessions" 
ON public.sales_training_sessions FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all business training sessions" 
ON public.sales_training_sessions FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for sales_training_conversations
CREATE POLICY "Users can manage their session conversations" 
ON public.sales_training_conversations FOR ALL 
USING (session_id IN (
  SELECT id FROM public.sales_training_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "Managers can view business conversations" 
ON public.sales_training_conversations FOR SELECT 
USING (session_id IN (
  SELECT id FROM public.sales_training_sessions 
  WHERE business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
  )
));

-- RLS Policies for sales_training_progress
CREATE POLICY "Users can manage their own training progress" 
ON public.sales_training_progress FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all business training progress" 
ON public.sales_training_progress FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for sales_training_goals
CREATE POLICY "Users can manage their own training goals" 
ON public.sales_training_goals FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all business training goals" 
ON public.sales_training_goals FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- RLS Policies for sales_training_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.sales_training_achievements FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" 
ON public.sales_training_achievements FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Managers can view all business achievements" 
ON public.sales_training_achievements FOR SELECT 
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND role IN ('business_owner', 'manager') AND is_active = true
));

-- Add triggers for updated_at
CREATE TRIGGER update_sales_training_modules_updated_at
  BEFORE UPDATE ON public.sales_training_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_content_updated_at
  BEFORE UPDATE ON public.sales_training_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_progress_updated_at
  BEFORE UPDATE ON public.sales_training_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_goals_updated_at
  BEFORE UPDATE ON public.sales_training_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();