-- Add payroll_email field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payroll_email TEXT;

-- Create payroll_periods table to track payroll generation
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  base_pay DECIMAL(10,2) DEFAULT 0,
  deductions JSONB DEFAULT '[]'::jsonb,
  additions JSONB DEFAULT '[]'::jsonb,
  gross_pay DECIMAL(10,2) DEFAULT 0,
  net_pay DECIMAL(10,2) DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  generated_by UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payroll_periods
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payroll_periods
CREATE POLICY "Managers can manage payroll periods"
ON public.payroll_periods
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager', 'office')
    AND is_active = true
));

CREATE POLICY "Employees can view their own payroll periods"
ON public.payroll_periods
FOR SELECT
USING (employee_id = auth.uid());

-- Create payroll_settings table for customization
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  company_logo_url TEXT,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  template_style JSONB DEFAULT '{}'::jsonb,
  email_subject TEXT DEFAULT 'Your Payroll Statement',
  email_template TEXT DEFAULT 'Please find your payroll statement attached.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payroll_settings
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payroll_settings
CREATE POLICY "Business members can manage payroll settings"
ON public.payroll_settings
FOR ALL
USING (business_id IN (
  SELECT business_id FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true
));

-- Create function to calculate payroll data
CREATE OR REPLACE FUNCTION public.calculate_payroll_data(
  p_employee_id UUID,
  p_business_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_sales DECIMAL,
  total_commission DECIMAL,
  total_hours DECIMAL,
  daily_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sales_data RECORD;
  timesheet_data RECORD;
  breakdown JSONB := '[]'::jsonb;
  daily_record JSONB;
BEGIN
  -- Calculate total sales and commission
  SELECT 
    COALESCE(SUM(o.total), 0) as sales,
    COALESCE(SUM(cp.commission_amount), 0) as commission
  INTO sales_data
  FROM public.orders o
  LEFT JOIN public.commission_payments cp ON cp.order_id = o.id
  JOIN public.stores s ON s.id = o.store_id
  WHERE o.user_id = p_employee_id
    AND s.business_id = p_business_id
    AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
    AND o.status = 'completed';

  -- Calculate total hours
  SELECT 
    COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600), 0) as hours
  INTO timesheet_data
  FROM public.timesheets t
  JOIN public.stores s ON s.id = t.store_id
  WHERE t.user_id = p_employee_id
    AND s.business_id = p_business_id
    AND DATE(t.clock_in) BETWEEN p_start_date AND p_end_date
    AND t.clock_out IS NOT NULL;

  -- Build daily breakdown
  FOR daily_record IN
    SELECT 
      DATE(o.created_at) as work_date,
      s.name as store_name,
      COALESCE(SUM(o.total), 0) as daily_sales,
      COALESCE(SUM(cp.commission_amount), 0) as daily_commission,
      COALESCE(
        (SELECT SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600)
         FROM public.timesheets t2 
         WHERE t2.user_id = p_employee_id 
           AND t2.store_id = s.id
           AND DATE(t2.clock_in) = DATE(o.created_at)
           AND t2.clock_out IS NOT NULL), 0
      ) as daily_hours
    FROM public.orders o
    LEFT JOIN public.commission_payments cp ON cp.order_id = o.id
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.user_id = p_employee_id
      AND s.business_id = p_business_id
      AND DATE(o.created_at) BETWEEN p_start_date AND p_end_date
      AND o.status = 'completed'
    GROUP BY DATE(o.created_at), s.id, s.name
    ORDER BY DATE(o.created_at), s.name
  LOOP
    breakdown := breakdown || jsonb_build_object(
      'date', daily_record.work_date,
      'store', daily_record.store_name,
      'sales', daily_record.daily_sales,
      'commission', daily_record.daily_commission,
      'hours', daily_record.daily_hours
    );
  END LOOP;

  RETURN QUERY SELECT 
    COALESCE(sales_data.sales, 0),
    COALESCE(sales_data.commission, 0),
    COALESCE(timesheet_data.hours, 0),
    breakdown;
END;
$$;

-- Add updated_at trigger for payroll tables
CREATE TRIGGER update_payroll_periods_updated_at
  BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_settings_updated_at
  BEFORE UPDATE ON public.payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();