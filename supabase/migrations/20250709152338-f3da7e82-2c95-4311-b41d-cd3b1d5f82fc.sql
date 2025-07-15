-- Create table for AI schedule insights
CREATE TABLE IF NOT EXISTS public.ai_schedule_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  insights_data JSONB NOT NULL DEFAULT '{}',
  learning_period TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for scheduled shifts if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scheduled_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('opener', 'upseller', 'manager', 'support')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_schedule_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_shifts ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_schedule_insights
CREATE POLICY "Managers can view AI insights" ON public.ai_schedule_insights
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "System can manage AI insights" ON public.ai_schedule_insights
  FOR ALL USING (true);

-- RLS policies for scheduled_shifts
CREATE POLICY "Business members can view shifts" ON public.scheduled_shifts
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Managers can manage shifts" ON public.scheduled_shifts
  FOR ALL USING (
    business_id IN (
      SELECT business_id FROM public.user_business_memberships 
      WHERE user_id = auth.uid() 
        AND role IN ('business_owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Users can view their own shifts" ON public.scheduled_shifts
  FOR SELECT USING (user_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_ai_schedule_insights_updated_at
  BEFORE UPDATE ON public.ai_schedule_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_shifts_updated_at
  BEFORE UPDATE ON public.scheduled_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.ai_schedule_insights 
  ADD CONSTRAINT ai_schedule_insights_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.scheduled_shifts 
  ADD CONSTRAINT scheduled_shifts_business_id_fkey 
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_schedule_insights_business_id ON public.ai_schedule_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_business_id ON public.scheduled_shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_user_id ON public.scheduled_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_date ON public.scheduled_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_shifts_store_id ON public.scheduled_shifts(store_id);