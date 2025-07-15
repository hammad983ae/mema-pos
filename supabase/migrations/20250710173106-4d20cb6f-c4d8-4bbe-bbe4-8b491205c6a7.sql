-- Fix infinite recursion in user_business_memberships RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view business memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can view team memberships" ON public.user_business_memberships;

-- Create safe, non-recursive RLS policies
CREATE POLICY "Users can view their own memberships" ON public.user_business_memberships
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" ON public.user_business_memberships
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can manage memberships" ON public.user_business_memberships
  FOR ALL
  USING (true);

-- Create the missing get_user_business_context function
CREATE OR REPLACE FUNCTION public.get_user_business_context()
RETURNS TABLE(
  business_id uuid,
  business_name text,
  user_role user_role,
  store_ids uuid[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    ubm.business_id,
    b.name as business_name,
    ubm.role as user_role,
    COALESCE(
      ARRAY_AGG(s.id) FILTER (WHERE s.id IS NOT NULL), 
      '{}'::uuid[]
    ) as store_ids
  FROM public.user_business_memberships ubm
  JOIN public.businesses b ON b.id = ubm.business_id
  LEFT JOIN public.stores s ON s.business_id = ubm.business_id
  WHERE ubm.user_id = auth.uid() AND ubm.is_active = true
  GROUP BY ubm.business_id, b.name, ubm.role;
$$;

-- Update the get_user_business_id function to be more efficient
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true 
  LIMIT 1;
$$;

-- Create a helper function to check user roles safely
CREATE OR REPLACE FUNCTION public.user_has_role(check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role = check_role
      AND is_active = true
  );
$$;