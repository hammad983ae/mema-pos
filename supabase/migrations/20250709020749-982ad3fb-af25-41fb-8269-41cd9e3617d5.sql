-- Add user position classifications and team compatibility data
ALTER TABLE public.profiles 
ADD COLUMN position_type TEXT CHECK (position_type IN ('opener', 'upseller')) DEFAULT NULL,
ADD COLUMN specialties TEXT[] DEFAULT '{}',
ADD COLUMN availability_preferences JSONB DEFAULT '{}',
ADD COLUMN performance_metrics JSONB DEFAULT '{}';

-- Create team compatibility tracking
CREATE TABLE public.team_compatibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  user_1_id UUID NOT NULL,
  user_2_id UUID NOT NULL,
  compatibility_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
  total_shifts_together INTEGER DEFAULT 0,
  successful_shifts INTEGER DEFAULT 0,
  average_sales_together DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_1_id, user_2_id)
);

-- Enable RLS on team compatibility
ALTER TABLE public.team_compatibility ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team compatibility
CREATE POLICY "Managers can manage team compatibility"
ON public.team_compatibility FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

CREATE POLICY "Users can view team compatibility in their business"
ON public.team_compatibility FOR SELECT
USING (
  business_id = public.get_user_business_id()
);

-- Create shift templates for scheduling
CREATE TABLE public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  store_id UUID,
  template_name TEXT NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_openers INTEGER DEFAULT 1,
  required_upsellers INTEGER DEFAULT 1,
  break_duration INTEGER DEFAULT 30, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shift templates
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shift templates
CREATE POLICY "Managers can manage shift templates"
ON public.shift_templates FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

CREATE POLICY "Users can view shift templates in their business"
ON public.shift_templates FOR SELECT
USING (
  business_id = public.get_user_business_id()
);

-- Create AI schedule recommendations table
CREATE TABLE public.schedule_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  schedule_date DATE NOT NULL,
  recommended_pairs JSONB NOT NULL, -- Array of user pairs with compatibility scores
  performance_prediction JSONB, -- Predicted sales, customer satisfaction, etc.
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  factors_considered TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, schedule_date)
);

-- Enable RLS on schedule recommendations
ALTER TABLE public.schedule_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schedule recommendations
CREATE POLICY "Managers can manage schedule recommendations"
ON public.schedule_recommendations FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Add updated_at triggers
CREATE TRIGGER update_team_compatibility_updated_at
BEFORE UPDATE ON public.team_compatibility
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_templates_updated_at
BEFORE UPDATE ON public.shift_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate team compatibility
CREATE OR REPLACE FUNCTION public.calculate_team_compatibility(
  p_business_id UUID,
  p_user_1_id UUID,
  p_user_2_id UUID
) RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  compatibility_score DECIMAL(3,2) := 0.50; -- Base score
  sales_performance DECIMAL(10,2);
  shift_success_rate DECIMAL(3,2);
BEGIN
  -- Get existing compatibility data
  SELECT 
    CASE 
      WHEN total_shifts_together > 0 THEN (successful_shifts::DECIMAL / total_shifts_together::DECIMAL)
      ELSE 0.50
    END,
    average_sales_together
  INTO shift_success_rate, sales_performance
  FROM public.team_compatibility
  WHERE business_id = p_business_id
    AND ((user_1_id = p_user_1_id AND user_2_id = p_user_2_id) 
         OR (user_1_id = p_user_2_id AND user_2_id = p_user_1_id));

  -- Calculate compatibility based on multiple factors
  compatibility_score := COALESCE(shift_success_rate, 0.50) * 0.6 + 
                        LEAST(COALESCE(sales_performance, 1000.00) / 2000.00, 1.00) * 0.4;

  RETURN GREATEST(0.00, LEAST(1.00, compatibility_score));
END;
$$;