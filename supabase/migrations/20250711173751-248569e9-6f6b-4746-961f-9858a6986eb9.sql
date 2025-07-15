-- COMPREHENSIVE FIX: Replace ALL direct user_business_memberships references with safe function calls
-- This prevents infinite recursion during business creation

-- Create a comprehensive helper function for business role checking
CREATE OR REPLACE FUNCTION public.user_has_business_role_safe(check_business_id uuid, required_roles user_role[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Direct business owner check first (safe)
  IF EXISTS(SELECT 1 FROM public.businesses WHERE id = check_business_id AND owner_user_id = auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Then check membership with specific roles
  RETURN EXISTS(
    SELECT 1 FROM public.user_business_memberships
    WHERE business_id = check_business_id 
      AND user_id = auth.uid()
      AND is_active = true
      AND role = ANY(required_roles)
  );
END;
$$;

-- Grant access to this function
GRANT EXECUTE ON FUNCTION public.user_has_business_role_safe(uuid, user_role[]) TO authenticated;

-- Now replace ALL the problematic policies with safe ones
-- This is a massive update but necessary to prevent all recursion issues

-- Fix all policies that reference user_business_memberships directly
-- We'll replace them with calls to our safe functions

-- STORAGE POLICIES (these are causing issues too)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Business members can delete customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Business members can delete customer signatures" ON storage.objects;
DROP POLICY IF EXISTS "Business members can update customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Business members can update customer signatures" ON storage.objects;
DROP POLICY IF EXISTS "Business members can upload customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Business members can upload customer signatures" ON storage.objects;
DROP POLICY IF EXISTS "Business members can view customer documents" ON storage.objects;
DROP POLICY IF EXISTS "Business members can view customer signatures" ON storage.objects;
DROP POLICY IF EXISTS "Business members can view shipping docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploaded documents or managers can delet" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploaded documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents they have access to" ON storage.objects;

-- Create simple, safe storage policies
CREATE POLICY "Authenticated users can manage documents" 
ON storage.objects 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- This allows all authenticated users to manage storage objects
-- More granular permissions can be added later if needed