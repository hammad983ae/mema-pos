-- Fix security warnings from audit report

-- Fix Function Search Path Mutable issues by adding SET search_path = ''
CREATE OR REPLACE FUNCTION public.check_pin_rate_limit(p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  failed_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check failed attempts in last hour
  SELECT COUNT(*), MAX(attempted_at) INTO failed_attempts, last_attempt
  FROM public.pin_attempts
  WHERE user_id = p_user_id 
    AND attempted_at > now() - INTERVAL '1 hour'
    AND success = false;
  
  -- Lock account for 1 hour after 5 failed attempts
  IF failed_attempts >= 5 THEN
    IF last_attempt > now() - INTERVAL '1 hour' THEN
      RETURN false; -- Account locked
    END IF;
  END IF;
  
  RETURN true; -- Attempts allowed
END;
$$;

CREATE OR REPLACE FUNCTION public.log_pin_attempt(p_user_id UUID, p_success BOOLEAN, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.pin_attempts (user_id, success, ip_address, user_agent)
  VALUES (p_user_id, p_success, p_ip_address, p_user_agent);
END;
$$;

-- Also fix the other security definer functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT business_id 
  FROM public.user_business_memberships 
  WHERE user_id = auth.uid() 
    AND is_active = true 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_business_role(check_roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND is_active = true 
      AND role = ANY(check_roles)
  );
$$;