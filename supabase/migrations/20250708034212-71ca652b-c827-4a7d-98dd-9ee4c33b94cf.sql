-- Create businesses table for multi-tenant structure
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  subscription_plan TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'active',
  owner_user_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('business_owner', 'manager', 'salesperson', 'employee');

-- Create user business memberships table
CREATE TABLE public.user_business_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  hired_date DATE DEFAULT CURRENT_DATE,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS on user business memberships
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

-- Create sales goals table
CREATE TABLE public.sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  target_amount DECIMAL(12,2) NOT NULL,
  target_transactions INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sales goals
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

-- Create employee schedules table
CREATE TABLE public.employee_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id),
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration INTEGER DEFAULT 30, -- minutes
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, schedule_date, start_time)
);

-- Enable RLS on employee schedules
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

-- Create end of day reports table
CREATE TABLE public.end_of_day_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  report_date DATE NOT NULL,
  total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  cash_sales DECIMAL(12,2) DEFAULT 0,
  card_sales DECIMAL(12,2) DEFAULT 0,
  returns_amount DECIMAL(12,2) DEFAULT 0,
  discounts_given DECIMAL(12,2) DEFAULT 0,
  opening_cash DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2) DEFAULT 0,
  cash_drops DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id, report_date)
);

-- Enable RLS on end of day reports
ALTER TABLE public.end_of_day_reports ENABLE ROW LEVEL SECURITY;

-- Add business_id to existing tables for multi-tenancy
ALTER TABLE public.stores ADD COLUMN business_id UUID REFERENCES public.businesses(id);
ALTER TABLE public.customers ADD COLUMN business_id UUID REFERENCES public.businesses(id);

-- Update profiles table to include business context
ALTER TABLE public.profiles ADD COLUMN phone TEXT;
ALTER TABLE public.profiles ADD COLUMN position TEXT;
ALTER TABLE public.profiles ADD COLUMN hire_date DATE;

-- RLS Policies for businesses
CREATE POLICY "Business owners can manage their business" 
ON public.businesses 
FOR ALL 
USING (owner_user_id = auth.uid());

CREATE POLICY "Business members can view their business" 
ON public.businesses 
FOR SELECT 
USING (
  id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- RLS Policies for user business memberships
CREATE POLICY "Business owners and managers can manage memberships" 
ON public.user_business_memberships 
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

CREATE POLICY "Users can view their own memberships" 
ON public.user_business_memberships 
FOR SELECT 
USING (user_id = auth.uid());

-- RLS Policies for sales goals
CREATE POLICY "Users can manage their own sales goals" 
ON public.sales_goals 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team sales goals" 
ON public.sales_goals 
FOR SELECT 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager')
    AND is_active = true
  )
);

-- RLS Policies for employee schedules
CREATE POLICY "Users can view their own schedules" 
ON public.employee_schedules 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage team schedules" 
ON public.employee_schedules 
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

-- RLS Policies for end of day reports
CREATE POLICY "Users can manage their own EOD reports" 
ON public.end_of_day_reports 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team EOD reports" 
ON public.end_of_day_reports 
FOR SELECT 
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager')
    AND is_active = true
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_business_memberships_updated_at
BEFORE UPDATE ON public.user_business_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_goals_updated_at
BEFORE UPDATE ON public.sales_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_schedules_updated_at
BEFORE UPDATE ON public.employee_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_end_of_day_reports_updated_at
BEFORE UPDATE ON public.end_of_day_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user's business context
CREATE OR REPLACE FUNCTION public.get_user_business_context(user_uuid UUID)
RETURNS TABLE (
  business_id UUID,
  business_name TEXT,
  user_role public.user_role,
  store_ids UUID[]
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    ubm.business_id,
    b.name as business_name,
    ubm.role as user_role,
    ARRAY_AGG(s.id) as store_ids
  FROM public.user_business_memberships ubm
  JOIN public.businesses b ON b.id = ubm.business_id
  LEFT JOIN public.stores s ON s.business_id = ubm.business_id
  WHERE ubm.user_id = user_uuid AND ubm.is_active = true
  GROUP BY ubm.business_id, b.name, ubm.role;
$$;