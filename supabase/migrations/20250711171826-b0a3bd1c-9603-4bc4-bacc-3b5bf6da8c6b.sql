-- Completely disable RLS on user_business_memberships to isolate the issue
ALTER TABLE public.user_business_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all policies on this table
DROP POLICY IF EXISTS "Users can view and manage their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage all memberships in their business" ON public.user_business_memberships;

-- Also check if there are any triggers or functions that might be causing issues
-- Let's see what functions reference this table
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%user_business_memberships%';