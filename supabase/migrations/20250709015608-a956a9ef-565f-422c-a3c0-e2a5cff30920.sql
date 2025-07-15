-- Fix infinite recursion in user_business_memberships RLS policies
-- Create security definer function to get user business context safely
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_business_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_business_role(check_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = ANY(check_roles)
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Business members can view their business" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their business memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can view team memberships" ON public.user_business_memberships;

-- Create safe RLS policies using security definer functions
CREATE POLICY "Business members can view their business" 
ON public.businesses FOR SELECT
USING (id = public.get_user_business_id());

CREATE POLICY "Users can view business memberships safely" 
ON public.user_business_memberships FOR SELECT
USING (
  business_id = public.get_user_business_id() 
  OR user_id = auth.uid()
);

CREATE POLICY "Managers can manage team memberships safely" 
ON public.user_business_memberships FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Fix other tables that might have similar issues
-- Update employee_schedules policies
DROP POLICY IF EXISTS "Managers can manage team schedules" ON public.employee_schedules;
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.employee_schedules;

CREATE POLICY "Users can view their own schedules safely" 
ON public.employee_schedules FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage team schedules safely" 
ON public.employee_schedules FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Update commission_payments policies  
DROP POLICY IF EXISTS "Managers can manage commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Managers can view team commission payments" ON public.commission_payments;

CREATE POLICY "Managers can manage commission payments safely" 
ON public.commission_payments FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Update other related policies
DROP POLICY IF EXISTS "Managers can manage employee goals" ON public.employee_goals;
DROP POLICY IF EXISTS "Managers can view team goals" ON public.employee_goals;

CREATE POLICY "Managers can manage employee goals safely" 
ON public.employee_goals FOR ALL
USING (
  business_id = public.get_user_business_id() 
  AND public.user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);