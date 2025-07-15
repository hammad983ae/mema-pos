-- Create shift templates table for permanent reusable shifts
CREATE TABLE public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER NOT NULL DEFAULT 30,
  days_of_week TEXT[] NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  required_openers INTEGER NOT NULL DEFAULT 1,
  required_upsellers INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule assignments table for final schedule submissions
CREATE TABLE public.schedule_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  schedule_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedule notifications table
CREATE TABLE public.schedule_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  schedule_assignment_id UUID NOT NULL REFERENCES public.schedule_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL DEFAULT 'schedule_published',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_templates
CREATE POLICY "Users can view shift templates in their business"
ON public.shift_templates
FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage shift templates"
ON public.shift_templates
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for schedule_assignments
CREATE POLICY "Users can view schedule assignments in their business"
ON public.schedule_assignments
FOR SELECT
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage schedule assignments"
ON public.schedule_assignments
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- RLS Policies for schedule_notifications
CREATE POLICY "Users can view their own schedule notifications"
ON public.schedule_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Business members can create notifications"
ON public.schedule_notifications
FOR INSERT
WITH CHECK (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Users can update their own notification read status"
ON public.schedule_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_shift_templates_updated_at
  BEFORE UPDATE ON public.shift_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_assignments_updated_at
  BEFORE UPDATE ON public.schedule_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_shift_templates_business_id ON public.shift_templates(business_id);
CREATE INDEX idx_shift_templates_store_id ON public.shift_templates(store_id);
CREATE INDEX idx_schedule_assignments_business_id ON public.schedule_assignments(business_id);
CREATE INDEX idx_schedule_assignments_week_start ON public.schedule_assignments(week_start_date);
CREATE INDEX idx_schedule_notifications_user_id ON public.schedule_notifications(user_id);
CREATE INDEX idx_schedule_notifications_is_read ON public.schedule_notifications(is_read);