-- PHASE 1: Critical Role Security Fixes

-- 1. Remove the dangerous role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 2. Create security definer function to safely check user roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true 
  LIMIT 1;
$$;

-- 3. Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role = check_role
      AND is_active = true
  );
$$;

-- 4. Create function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(check_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role = ANY(check_roles)
      AND is_active = true
  );
$$;

-- 5. Update user_business_memberships RLS policies to be more secure
DROP POLICY IF EXISTS "Users can manage their own memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Service role can manage all memberships" ON public.user_business_memberships;

-- Only allow viewing own membership
CREATE POLICY "Users can view their own membership"
ON public.user_business_memberships
FOR SELECT
USING (user_id = auth.uid());

-- Only allow business owners and managers to modify memberships
CREATE POLICY "Business owners and managers can manage memberships"
ON public.user_business_memberships
FOR ALL
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager')
      AND is_active = true
  )
);

-- Service role can still manage all (for system operations)
CREATE POLICY "Service role can manage all memberships"
ON public.user_business_memberships
FOR ALL
USING (current_setting('role') = 'service_role');

-- 6. Create audit table for role changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  old_role user_role,
  new_role user_role NOT NULL,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only managers and business owners can view role change audits
CREATE POLICY "Managers can view role audits"
ON public.role_change_audit
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager')
      AND is_active = true
  )
);

-- System can insert audit records
CREATE POLICY "System can insert audit records"
ON public.role_change_audit
FOR INSERT
WITH CHECK (true);

-- 7. Create trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only log if role actually changed
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (
      user_id,
      business_id,
      old_role,
      new_role,
      changed_by
    ) VALUES (
      NEW.user_id,
      NEW.business_id,
      OLD.role,
      NEW.role,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_business_memberships
DROP TRIGGER IF EXISTS role_change_audit_trigger ON public.user_business_memberships;
CREATE TRIGGER role_change_audit_trigger
  AFTER UPDATE ON public.user_business_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

-- 8. Create function to safely get user business context
CREATE OR REPLACE FUNCTION public.get_user_business_context_secure()
RETURNS TABLE(business_id uuid, business_name text, user_role user_role, store_ids uuid[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
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