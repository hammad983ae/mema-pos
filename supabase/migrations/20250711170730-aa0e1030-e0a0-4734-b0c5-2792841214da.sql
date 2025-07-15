-- First, drop the problematic policies that are causing recursion
DROP POLICY IF EXISTS "Business members can view their memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_business_memberships;

-- Create security definer functions to prevent recursion
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
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
SET search_path TO ''
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
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = ANY(check_roles)
  );
$$;

-- Now create safe RLS policies using the security definer functions
CREATE POLICY "Users can view their own memberships" 
ON public.user_business_memberships 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" 
ON public.user_business_memberships 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Business owners can manage all memberships in their business" 
ON public.user_business_memberships 
FOR ALL 
USING (
  business_id IN (
    SELECT b.id 
    FROM public.businesses b 
    WHERE b.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Managers can view memberships in their business" 
ON public.user_business_memberships 
FOR SELECT 
USING (
  business_id IN (
    SELECT b.id 
    FROM public.businesses b 
    WHERE b.owner_user_id = auth.uid()
  )
  OR 
  user_id = auth.uid()
);