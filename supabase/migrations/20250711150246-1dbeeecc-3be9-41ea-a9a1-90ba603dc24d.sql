-- Phase 1: Critical Role Security Fixes
-- Fix Role Escalation Vulnerability by securing the profiles table and user_business_memberships

-- First, let's remove the ability for users to update their own role in profiles
-- We'll drop the existing problematic policies and create secure ones

-- Drop existing potentially insecure policies on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create secure profiles policies that prevent role manipulation
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile (excluding role)" 
ON public.profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Prevent users from updating critical security fields
  OLD.role = NEW.role AND
  OLD.user_id = NEW.user_id
);

-- Create policy for managers to update user profiles (including roles)
CREATE POLICY "Managers can update team member profiles" 
ON public.profiles FOR UPDATE
USING (
  user_id IN (
    SELECT ubm.user_id 
    FROM public.user_business_memberships ubm
    WHERE ubm.business_id = get_user_business_id()
      AND ubm.user_id = profiles.user_id
  ) AND
  user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Fix user_business_memberships RLS policies to prevent role escalation
DROP POLICY IF EXISTS "Users can view business memberships safely" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can manage team memberships safely" ON public.user_business_memberships;

-- Create secure user_business_memberships policies
CREATE POLICY "Users can view their own membership" 
ON public.user_business_memberships FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view team memberships" 
ON public.user_business_memberships FOR SELECT
USING (
  business_id = get_user_business_id() AND
  user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role])
);

-- Only business owners can modify user roles and memberships
CREATE POLICY "Business owners can manage memberships" 
ON public.user_business_memberships FOR ALL
USING (
  business_id = get_user_business_id() AND
  user_has_business_role(ARRAY['business_owner'::user_role])
);

-- Managers can invite new members but cannot change existing roles
CREATE POLICY "Managers can invite new members" 
ON public.user_business_memberships FOR INSERT
WITH CHECK (
  business_id = get_user_business_id() AND
  user_has_business_role(ARRAY['business_owner'::user_role, 'manager'::user_role]) AND
  role IN ('employee'::user_role, 'salesperson'::user_role) -- Only allow non-privileged roles
);

-- Create audit logging function for role changes
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any role changes for security auditing
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    PERFORM log_activity(
      'role_changed',
      'user_business_membership',
      NEW.id,
      jsonb_build_object('old_role', OLD.role, 'user_id', OLD.user_id),
      jsonb_build_object('new_role', NEW.role, 'user_id', NEW.user_id),
      'User role changed from ' || OLD.role || ' to ' || NEW.role,
      NEW.business_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_role_changes ON public.user_business_memberships;
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.user_business_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();

-- Create secure function to check if user can modify roles
CREATE OR REPLACE FUNCTION can_modify_user_role(target_user_id UUID, target_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only business owners can modify roles of other users
  RETURN EXISTS (
    SELECT 1 FROM public.user_business_memberships
    WHERE user_id = auth.uid()
      AND business_id = target_business_id
      AND role = 'business_owner'::user_role
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;