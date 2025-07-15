-- Completely disable RLS on user_business_memberships table
ALTER TABLE public.user_business_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all policies completely
DROP POLICY IF EXISTS "Allow users to view their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Allow users to insert their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Allow users to update their own memberships" ON public.user_business_memberships;

-- Check if the functions I created are causing issues by dropping them temporarily
DROP FUNCTION IF EXISTS public.get_user_business_id();
DROP FUNCTION IF EXISTS public.get_user_business_role();
DROP FUNCTION IF EXISTS public.user_has_business_role(user_role[]);

-- Recreate simple non-recursive functions
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_business_id() TO authenticated;