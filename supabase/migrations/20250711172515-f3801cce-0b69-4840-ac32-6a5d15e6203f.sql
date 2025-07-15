-- Create a comprehensive solution to handle business ownership checks safely
-- This function bypasses RLS to avoid circular dependencies during business creation

CREATE OR REPLACE FUNCTION public.user_can_access_business(check_business_id uuid, required_roles user_role[] DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  is_owner boolean := false;
  has_membership boolean := false;
BEGIN
  -- First check if user is the business owner (this is safe and doesn't cause recursion)
  SELECT EXISTS(
    SELECT 1 FROM public.businesses 
    WHERE id = check_business_id AND owner_user_id = auth.uid()
  ) INTO is_owner;
  
  -- If they're the owner, they have access regardless of roles
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- If specific roles are required, check membership
  IF required_roles IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_business_memberships
      WHERE business_id = check_business_id 
        AND user_id = auth.uid()
        AND is_active = true
        AND role = ANY(required_roles)
    ) INTO has_membership;
  ELSE
    -- If no specific roles required, just check for any active membership
    SELECT EXISTS(
      SELECT 1 FROM public.user_business_memberships
      WHERE business_id = check_business_id 
        AND user_id = auth.uid()
        AND is_active = true
    ) INTO has_membership;
  END IF;
  
  RETURN has_membership;
END;
$$;

-- Grant access to this function
GRANT EXECUTE ON FUNCTION public.user_can_access_business(uuid, user_role[]) TO authenticated;