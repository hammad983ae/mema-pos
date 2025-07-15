-- Completely disable RLS temporarily to stop the recursion
ALTER TABLE public.user_business_memberships DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Users can insert their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage all memberships in their business" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can view memberships in their business" ON public.user_business_memberships;

-- Also drop any other policies that might exist
DROP POLICY IF EXISTS "Enable read access for users" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Enable insert for users" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Enable update for users" ON public.user_business_memberships;

-- Now re-enable RLS
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that don't reference other tables
CREATE POLICY "Allow users to view their own memberships" 
ON public.user_business_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own memberships" 
ON public.user_business_memberships 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own memberships" 
ON public.user_business_memberships 
FOR UPDATE 
USING (user_id = auth.uid());