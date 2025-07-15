-- Add store access codes to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS pos_access_code TEXT;

-- Function to generate unique store access codes
CREATE OR REPLACE FUNCTION public.generate_store_access_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.stores 
    WHERE pos_access_code = code;
    
    -- Exit loop if unique
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Generate access codes for existing stores
UPDATE public.stores 
SET pos_access_code = public.generate_store_access_code()
WHERE pos_access_code IS NULL;

-- Trigger to auto-generate access codes for new stores
CREATE OR REPLACE FUNCTION public.assign_store_access_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pos_access_code IS NULL THEN
    NEW.pos_access_code := public.generate_store_access_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS auto_assign_store_access_code ON public.stores;
CREATE TRIGGER auto_assign_store_access_code
  BEFORE INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_store_access_code();

-- Create table for tracking clocked-in employees
CREATE TABLE IF NOT EXISTS public.employee_clock_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  clocked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clocked_out_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_clock_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_clock_status
CREATE POLICY "Business members can view clock status" 
ON public.employee_clock_status 
FOR SELECT 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
));

CREATE POLICY "Employees can manage their own clock status" 
ON public.employee_clock_status 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage all clock status" 
ON public.employee_clock_status 
FOR ALL 
USING (business_id IN (
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND role IN ('business_owner', 'manager') 
    AND is_active = true
));

-- Add trigger for updated_at
CREATE TRIGGER update_employee_clock_status_updated_at
  BEFORE UPDATE ON public.employee_clock_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();