-- Sales Training System Database Schema - Clean Migration

-- Enable vector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing objects if they exist (in reverse dependency order)
DROP TRIGGER IF EXISTS update_sales_training_goals_updated_at ON public.sales_training_goals;
DROP TRIGGER IF EXISTS update_sales_training_progress_updated_at ON public.sales_training_progress;
DROP TRIGGER IF EXISTS update_sales_training_sessions_updated_at ON public.sales_training_sessions;
DROP TRIGGER IF EXISTS update_sales_training_content_updated_at ON public.sales_training_content;
DROP TRIGGER IF EXISTS update_sales_training_modules_updated_at ON public.sales_training_modules;

DROP TABLE IF EXISTS public.sales_training_achievements CASCADE;
DROP TABLE IF EXISTS public.sales_training_goals CASCADE;
DROP TABLE IF EXISTS public.sales_training_conversations CASCADE;
DROP TABLE IF EXISTS public.sales_training_progress CASCADE;
DROP TABLE IF EXISTS public.sales_training_sessions CASCADE;
DROP TABLE IF EXISTS public.sales_training_content CASCADE;
DROP TABLE IF EXISTS public.sales_training_modules CASCADE;

DROP TYPE IF EXISTS training_session_status;
DROP TYPE IF EXISTS training_content_type;
DROP TYPE IF EXISTS training_module_type;

-- Create enum for training module types
CREATE TYPE training_module_type AS ENUM (
  'mindset',
  'finding_why', 
  'sample_approach',
  'connection_building',
  'objection_handling',
  'closing_techniques',
  'opener_to_upseller',
  'high_pressure_tactics',
  'product_knowledge',
  'customer_psychology'
);

-- Create enum for training content types
CREATE TYPE training_content_type AS ENUM (
  'book_chapter',
  'scenario',
  'script',
  'roleplay',
  'quiz',
  'video',
  'audio'
);

-- Create enum for session status
CREATE TYPE training_session_status AS ENUM (
  'in_progress',
  'completed',
  'paused',
  'abandoned'
);

-- Main training modules table
CREATE TABLE public.sales_training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  module_type training_module_type NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration_minutes INTEGER DEFAULT 30,
  prerequisite_modules UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Training content - stores chunked book content, scenarios, scripts etc
CREATE TABLE public.sales_training_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type training_content_type NOT NULL,
  language_code TEXT DEFAULT 'en' NOT NULL,
  embedding VECTOR(1536), -- For AI similarity search
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training sessions - track individual training interactions
CREATE TABLE public.sales_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  session_status training_session_status DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2), -- 0-100 score
  feedback_given TEXT,
  session_data JSONB DEFAULT '{}', -- Store conversation, answers, etc
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track overall progress per user per module
CREATE TABLE public.sales_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  completion_percentage DECIMAL(5,2) DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  total_time_spent_seconds INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  best_score DECIMAL(5,2),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- AI conversation history for training sessions
CREATE TABLE public.sales_training_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sales_training_sessions(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Training goals set by users or managers
CREATE TABLE public.sales_training_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'weekly_hours', 'module_completion', 'skill_improvement'
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  target_date DATE,
  description TEXT,
  created_by UUID NOT NULL, -- manager or self
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Training certificates/achievements
CREATE TABLE public.sales_training_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.sales_training_modules(id) ON DELETE SET NULL,
  achievement_type TEXT NOT NULL, -- 'module_completion', 'high_score', 'streak', 'improvement'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'award',
  points_awarded INTEGER DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_training_content_module ON public.sales_training_content(module_id);
CREATE INDEX idx_training_content_language ON public.sales_training_content(language_code);
CREATE INDEX idx_training_content_embedding ON public.sales_training_content USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_training_sessions_user_module ON public.sales_training_sessions(user_id, module_id);
CREATE INDEX idx_training_progress_user ON public.sales_training_progress(user_id);
CREATE INDEX idx_training_progress_business ON public.sales_training_progress(business_id);
CREATE INDEX idx_training_conversations_session ON public.sales_training_conversations(session_id);
CREATE INDEX idx_training_goals_user ON public.sales_training_goals(user_id);
CREATE INDEX idx_training_achievements_user ON public.sales_training_achievements(user_id);

-- Enable RLS on all tables
ALTER TABLE public.sales_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_conversations ENABLE ROW LEVEL SECURITY;
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
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for sales_training_content
CREATE POLICY "Business members can view training content" 
ON public.sales_training_content FOR SELECT
USING (module_id IN (
  SELECT id FROM public.sales_training_modules sm
  WHERE sm.business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
));

CREATE POLICY "Managers can manage training content" 
ON public.sales_training_content FOR ALL
USING (module_id IN (
  SELECT id FROM public.sales_training_modules sm
  WHERE sm.business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
));

-- RLS Policies for sales_training_sessions
CREATE POLICY "Users can view their own training sessions" 
ON public.sales_training_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own training sessions" 
ON public.sales_training_sessions FOR INSERT
WITH CHECK (user_id = auth.uid() AND business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can update their own training sessions" 
ON public.sales_training_sessions FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all team training sessions" 
ON public.sales_training_sessions FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for sales_training_progress
CREATE POLICY "Users can view their own training progress" 
ON public.sales_training_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own training progress" 
ON public.sales_training_progress FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all team training progress" 
ON public.sales_training_progress FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for sales_training_conversations
CREATE POLICY "Users can view their own training conversations" 
ON public.sales_training_conversations FOR SELECT
USING (session_id IN (
  SELECT id FROM public.sales_training_sessions 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own training conversations" 
ON public.sales_training_conversations FOR INSERT
WITH CHECK (session_id IN (
  SELECT id FROM public.sales_training_sessions 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Managers can view team training conversations" 
ON public.sales_training_conversations FOR SELECT
USING (session_id IN (
  SELECT sts.id FROM public.sales_training_sessions sts
  WHERE sts.business_id IN (
    SELECT business_id FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
));

-- RLS Policies for sales_training_goals
CREATE POLICY "Users can view their own training goals" 
ON public.sales_training_goals FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own training goals" 
ON public.sales_training_goals FOR INSERT
WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Users can update their own training goals" 
ON public.sales_training_goals FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage team training goals" 
ON public.sales_training_goals FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for sales_training_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.sales_training_achievements FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create achievements" 
ON public.sales_training_achievements FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers can view team achievements" 
ON public.sales_training_achievements FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- Add updated_at triggers
CREATE TRIGGER update_sales_training_modules_updated_at
  BEFORE UPDATE ON public.sales_training_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_content_updated_at
  BEFORE UPDATE ON public.sales_training_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_sessions_updated_at
  BEFORE UPDATE ON public.sales_training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_progress_updated_at
  BEFORE UPDATE ON public.sales_training_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_goals_updated_at
  BEFORE UPDATE ON public.sales_training_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();