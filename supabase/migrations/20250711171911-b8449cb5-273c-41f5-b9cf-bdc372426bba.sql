-- Completely disable RLS on user_business_memberships to isolate the issue
ALTER TABLE public.user_business_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all policies on this table
DROP POLICY IF EXISTS "Users can view and manage their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage all memberships in their business" ON public.user_business_memberships;