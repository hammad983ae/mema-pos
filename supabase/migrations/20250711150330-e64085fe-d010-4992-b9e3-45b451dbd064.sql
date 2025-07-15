-- Phase 1: Critical Role Security Fixes
-- Fix Role Escalation Vulnerability by securing the profiles table and user_business_memberships

-- Drop all existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (excluding role)" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update team member profiles" ON public.profiles;

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
  (OLD.role IS NULL OR OLD.role = NEW.role) AND
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
DROP POLICY IF EXISTS "Users can view their own membership" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can view team memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Business owners can manage memberships" ON public.user_business_memberships;
DROP POLICY IF EXISTS "Managers can invite new members" ON public.user_business_memberships;

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