-- Create sales training modules table
CREATE TABLE public.sales_training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL CHECK (module_type IN (
    'mindset', 'finding_why', 'sample_approach', 'connection_building',
    'objection_handling', 'closing_techniques', 'opener_to_upseller',
    'high_pressure_tactics', 'product_knowledge', 'customer_psychology',
    'sales_triangle', 'cocos_methodology', 'resistance_handling'
  )),
  difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
  content JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create sales training progress table
CREATE TABLE public.sales_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  total_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  best_score NUMERIC(5,2) DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create sales training sessions table
CREATE TABLE public.sales_training_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.sales_training_modules(id) ON DELETE CASCADE,
  session_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (session_status IN ('in_progress', 'completed', 'abandoned')),
  total_duration_seconds INTEGER DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  performance_score NUMERIC(5,2) DEFAULT 0,
  feedback_given TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales training conversations table
CREATE TABLE public.sales_training_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sales_training_sessions(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, message_index)
);

-- Create indexes for performance
CREATE INDEX idx_sales_training_modules_business_id ON public.sales_training_modules(business_id);
CREATE INDEX idx_sales_training_modules_type ON public.sales_training_modules(module_type);
CREATE INDEX idx_sales_training_progress_user_id ON public.sales_training_progress(user_id);
CREATE INDEX idx_sales_training_progress_module_id ON public.sales_training_progress(module_id);
CREATE INDEX idx_sales_training_sessions_user_id ON public.sales_training_sessions(user_id);
CREATE INDEX idx_sales_training_sessions_module_id ON public.sales_training_sessions(module_id);
CREATE INDEX idx_sales_training_conversations_session_id ON public.sales_training_conversations(session_id);

-- Enable RLS
ALTER TABLE public.sales_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_training_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_training_modules
CREATE POLICY "Business members can view training modules" ON public.sales_training_modules
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can manage training modules" ON public.sales_training_modules
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager') 
        AND is_active = true
    )
  );

-- RLS Policies for sales_training_progress
CREATE POLICY "Users can view their own progress" ON public.sales_training_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON public.sales_training_progress
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view team progress" ON public.sales_training_progress
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager') 
        AND is_active = true
    )
  );

-- RLS Policies for sales_training_sessions
CREATE POLICY "Users can manage their own sessions" ON public.sales_training_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Managers can view team sessions" ON public.sales_training_sessions
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager') 
        AND is_active = true
    )
  );

-- RLS Policies for sales_training_conversations
CREATE POLICY "Users can manage their own conversations" ON public.sales_training_conversations
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.sales_training_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at timestamps
CREATE TRIGGER update_sales_training_modules_updated_at
  BEFORE UPDATE ON public.sales_training_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_progress_updated_at
  BEFORE UPDATE ON public.sales_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_training_sessions_updated_at
  BEFORE UPDATE ON public.sales_training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();