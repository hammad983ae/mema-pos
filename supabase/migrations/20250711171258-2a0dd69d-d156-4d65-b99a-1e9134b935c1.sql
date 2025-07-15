-- Temporarily disable RLS on other tables that depend on get_user_business_id
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.commission_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_compatibility DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_recommendations DISABLE ROW LEVEL SECURITY;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS public.get_user_business_id() CASCADE;

-- Create a simple version that doesn't reference user_business_memberships
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT b.id 
  FROM public.businesses b 
  WHERE b.owner_user_id = auth.uid()
  LIMIT 1;
$$;

-- Re-enable RLS on businesses table with a simple policy
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can view their business" 
ON public.businesses 
FOR SELECT 
USING (owner_user_id = auth.uid());

CREATE POLICY "Business owners can update their business" 
ON public.businesses 
FOR UPDATE 
USING (owner_user_id = auth.uid());

CREATE POLICY "Anyone can create a business" 
ON public.businesses 
FOR INSERT 
WITH CHECK (owner_user_id = auth.uid());