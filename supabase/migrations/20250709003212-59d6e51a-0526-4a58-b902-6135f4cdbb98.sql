
-- Create performance review templates table
CREATE TABLE public.performance_review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  review_type TEXT NOT NULL DEFAULT 'annual', -- 'annual', 'quarterly', 'monthly', '90_day', 'custom'
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance review questions table
CREATE TABLE public.performance_review_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.performance_review_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'rating', 'scale', 'multiple_choice', 'yes_no'
  options JSONB, -- for multiple choice questions
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  category TEXT, -- 'performance', 'goals', 'skills', 'culture', 'development'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance reviews table
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.performance_review_templates(id),
  reviewee_id UUID NOT NULL, -- Employee being reviewed
  reviewer_id UUID NOT NULL, -- Primary reviewer (usually manager)
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  overall_rating DECIMAL(3,2), -- Overall rating if applicable
  manager_notes TEXT,
  employee_notes TEXT,
  action_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance review responses table
CREATE TABLE public.performance_review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.performance_review_questions(id) ON DELETE CASCADE,
  response_text TEXT,
  response_rating DECIMAL(3,2),
  response_data JSONB, -- For complex responses
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create 360-degree feedback table
CREATE TABLE public.review_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  feedback_provider_id UUID NOT NULL, -- Who is giving feedback
  feedback_type TEXT NOT NULL, -- 'peer', 'subordinate', 'manager', 'self', 'customer'
  feedback_text TEXT,
  rating DECIMAL(3,2),
  is_anonymous BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'reviewed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance metrics table
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_type TEXT NOT NULL, -- 'sales', 'productivity', 'attendance', 'customer_satisfaction', 'custom'
  measurement_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  recorded_date DATE NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_performance_reviews_reviewee ON public.performance_reviews(reviewee_id);
CREATE INDEX idx_performance_reviews_reviewer ON public.performance_reviews(reviewer_id);
CREATE INDEX idx_performance_reviews_business ON public.performance_reviews(business_id);
CREATE INDEX idx_performance_reviews_status ON public.performance_reviews(status);
CREATE INDEX idx_performance_metrics_user_date ON public.performance_metrics(user_id, recorded_date);
CREATE INDEX idx_performance_metrics_business ON public.performance_metrics(business_id);
CREATE INDEX idx_review_feedback_review ON public.review_feedback(review_id);

-- Enable RLS on all performance tables
ALTER TABLE public.performance_review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_review_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_review_templates
CREATE POLICY "Managers can manage review templates" 
ON public.performance_review_templates FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view review templates in their business" 
ON public.performance_review_templates FOR SELECT 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.is_active = true
));

-- RLS Policies for performance_review_questions
CREATE POLICY "Users can view questions for accessible templates" 
ON public.performance_review_questions FOR SELECT 
USING (template_id IN (
  SELECT id FROM public.performance_review_templates
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.is_active = true
  )
));

CREATE POLICY "Managers can manage review questions" 
ON public.performance_review_questions FOR ALL 
USING (template_id IN (
  SELECT id FROM public.performance_review_templates
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
      AND user_business_memberships.is_active = true
  )
));

-- RLS Policies for performance_reviews
CREATE POLICY "Managers can manage reviews" 
ON public.performance_reviews FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view their own reviews" 
ON public.performance_reviews FOR SELECT 
USING (reviewee_id = auth.uid() OR reviewer_id = auth.uid());

-- RLS Policies for performance_review_responses
CREATE POLICY "Users can manage responses to their reviews" 
ON public.performance_review_responses FOR ALL 
USING (review_id IN (
  SELECT id FROM public.performance_reviews
  WHERE reviewee_id = auth.uid() OR reviewer_id = auth.uid()
));

CREATE POLICY "Managers can view team review responses" 
ON public.performance_review_responses FOR SELECT 
USING (review_id IN (
  SELECT id FROM public.performance_reviews
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
      AND user_business_memberships.is_active = true
  )
));

-- RLS Policies for review_feedback
CREATE POLICY "Users can provide feedback for assigned reviews" 
ON public.review_feedback FOR ALL 
USING (feedback_provider_id = auth.uid());

CREATE POLICY "Managers can view team feedback" 
ON public.review_feedback FOR SELECT 
USING (review_id IN (
  SELECT id FROM public.performance_reviews
  WHERE business_id IN (
    SELECT user_business_memberships.business_id
    FROM user_business_memberships
    WHERE user_business_memberships.user_id = auth.uid() 
      AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
      AND user_business_memberships.is_active = true
  )
));

-- RLS Policies for performance_metrics
CREATE POLICY "Managers can manage team metrics" 
ON public.performance_metrics FOR ALL 
USING (business_id IN (
  SELECT user_business_memberships.business_id
  FROM user_business_memberships
  WHERE user_business_memberships.user_id = auth.uid() 
    AND user_business_memberships.role = ANY (ARRAY['business_owner'::user_role, 'manager'::user_role, 'office'::user_role])
    AND user_business_memberships.is_active = true
));

CREATE POLICY "Users can view their own metrics" 
ON public.performance_metrics FOR SELECT 
USING (user_id = auth.uid());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_performance_review_templates_updated_at
BEFORE UPDATE ON public.performance_review_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at
BEFORE UPDATE ON public.performance_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_review_responses_updated_at
BEFORE UPDATE ON public.performance_review_responses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default review template
INSERT INTO public.performance_review_templates (business_id, name, description, review_type, created_by)
SELECT 
  b.id,
  'Annual Performance Review',
  'Comprehensive annual review template covering performance, goals, and development',
  'annual',
  b.owner_user_id
FROM public.businesses b;

-- Insert default questions for the template
INSERT INTO public.performance_review_questions (template_id, question_text, question_type, category, display_order)
SELECT 
  t.id,
  unnest(ARRAY[
    'How would you rate your overall performance this year?',
    'What were your key accomplishments this review period?',
    'What goals did you achieve and which ones need continued focus?',
    'What skills would you like to develop further?',
    'How satisfied are you with your current role and responsibilities?',
    'What support do you need from your manager/team?',
    'What are your career development goals for the next year?'
  ]),
  unnest(ARRAY['rating', 'text', 'text', 'text', 'rating', 'text', 'text']),
  unnest(ARRAY['performance', 'performance', 'goals', 'development', 'satisfaction', 'support', 'development']),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7])
FROM public.performance_review_templates t
WHERE t.name = 'Annual Performance Review';
