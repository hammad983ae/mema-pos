-- Re-enable RLS first
ALTER TABLE public.user_business_memberships ENABLE ROW LEVEL SECURITY;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Business owners and managers can manage memberships" ON public.user_business_memberships;

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Users can view their own membership" ON public.user_business_memberships;

-- Create a proper non-recursive policy for business owners
CREATE POLICY "Business owners can manage all memberships in their business" 
ON public.user_business_memberships 
FOR ALL 
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
  )
);