-- Create manager approval requests table
CREATE TABLE public.manager_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  sale_amount NUMERIC NOT NULL,
  minimum_amount NUMERIC NOT NULL,
  items_summary JSONB,
  approval_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE,
  approval_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manager_approval_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business members can view approval requests" 
ON public.manager_approval_requests 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Employees can create approval requests" 
ON public.manager_approval_requests 
FOR INSERT 
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  ) AND employee_id = auth.uid()
);

CREATE POLICY "Managers can update approval requests" 
ON public.manager_approval_requests 
FOR UPDATE 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

-- Create business settings table for minimum sale amounts
CREATE TABLE public.business_pos_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL UNIQUE,
  minimum_sale_amount NUMERIC DEFAULT 0,
  require_manager_approval BOOLEAN DEFAULT false,
  manager_notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_pos_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business members can view POS settings" 
ON public.business_pos_settings 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Managers can manage POS settings" 
ON public.business_pos_settings 
FOR ALL 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager') 
      AND is_active = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_manager_approval_requests_updated_at
BEFORE UPDATE ON public.manager_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_pos_settings_updated_at
BEFORE UPDATE ON public.business_pos_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();