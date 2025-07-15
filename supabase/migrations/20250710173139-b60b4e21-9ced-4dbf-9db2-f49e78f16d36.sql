-- Fix infinite recursion in user_business_memberships RLS policies
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Business owners and managers can manage memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can manage team memberships safely" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Users can view business memberships safely" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_business_memberships;

-- Create simple, non-recursive policies
CREATE POLICY "Users can manage their own memberships" ON public.user_business_memberships
  FOR ALL
  USING (user_id = auth.uid());

-- Allow system operations (for edge functions and triggers)
CREATE POLICY "Service role can manage all memberships" ON public.user_business_memberships
  FOR ALL
  USING (current_setting('role') = 'service_role');

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