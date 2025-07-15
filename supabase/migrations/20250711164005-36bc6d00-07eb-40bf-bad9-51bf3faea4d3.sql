-- PHASE 2: Authentication Security Improvements

-- 1. Create table for PIN attempt tracking with rate limiting
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  lockout_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on pin_attempts
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own attempts
CREATE POLICY "Users can view their own PIN attempts"
ON public.pin_attempts
FOR SELECT
USING (user_id = auth.uid());

-- System can insert attempt records
CREATE POLICY "System can insert PIN attempts"
ON public.pin_attempts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Managers can view all attempts for security monitoring
CREATE POLICY "Managers can view PIN attempts"
ON public.pin_attempts
FOR SELECT
USING (
  user_id IN (
    SELECT ubm.user_id 
    FROM public.user_business_memberships ubm
    JOIN public.user_business_memberships my_membership ON my_membership.business_id = ubm.business_id
    WHERE my_membership.user_id = auth.uid()
      AND my_membership.role IN ('business_owner', 'manager')
      AND my_membership.is_active = true
  )
);

-- 2. Create function to check PIN rate limits
CREATE OR REPLACE FUNCTION public.check_pin_rate_limit_secure(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  failed_attempts INTEGER;
  last_attempt TIMESTAMP WITH TIME ZONE;
  lockout_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is currently locked out
  SELECT max(lockout_until) INTO lockout_until
  FROM public.pin_attempts
  WHERE user_id = p_user_id 
    AND lockout_until > now();
  
  IF lockout_until IS NOT NULL THEN
    RETURN false; -- User is locked out
  END IF;

  -- Check failed attempts in last hour
  SELECT COUNT(*), MAX(attempted_at) INTO failed_attempts, last_attempt
  FROM public.pin_attempts
  WHERE user_id = p_user_id 
    AND attempted_at > now() - INTERVAL '1 hour'
    AND success = false;
  
  -- Lock account for 1 hour after 5 failed attempts
  IF failed_attempts >= 5 THEN
    -- Insert lockout record
    INSERT INTO public.pin_attempts (user_id, success, lockout_until)
    VALUES (p_user_id, false, now() + INTERVAL '1 hour');
    RETURN false;
  END IF;
  
  RETURN true; -- Attempts allowed
END;
$$;

-- 3. Create function to log PIN attempts
CREATE OR REPLACE FUNCTION public.log_pin_attempt_secure(
  p_user_id uuid, 
  p_success boolean, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.pin_attempts (user_id, success, ip_address, user_agent)
  VALUES (p_user_id, p_success, p_ip_address, p_user_agent);
END;
$$;

-- 4. Update profiles table to store hashed PINs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pos_pin_hash TEXT;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pos_pin;

-- 5. Create function to verify PIN hash
CREATE OR REPLACE FUNCTION public.verify_pin_hash(user_id uuid, pin_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  stored_hash TEXT;
  rate_limit_ok BOOLEAN;
BEGIN
  -- Check rate limiting first
  SELECT public.check_pin_rate_limit_secure(user_id) INTO rate_limit_ok;
  
  IF NOT rate_limit_ok THEN
    RETURN false;
  END IF;

  -- Get stored hash
  SELECT pos_pin_hash INTO stored_hash
  FROM public.profiles
  WHERE id = user_id;

  -- For now, do simple comparison (will implement proper hashing in application layer)
  -- This is temporary until we can implement bcrypt hashing
  IF stored_hash = pin_input THEN
    -- Log successful attempt
    PERFORM public.log_pin_attempt_secure(user_id, true);
    RETURN true;
  ELSE
    -- Log failed attempt
    PERFORM public.log_pin_attempt_secure(user_id, false);
    RETURN false;
  END IF;
END;
$$;

-- 6. Create session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
FOR SELECT
USING (user_id = auth.uid());

-- System can manage sessions
CREATE POLICY "System can manage sessions"
ON public.user_sessions
FOR ALL
USING (true);

-- 7. Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
$$;

-- 8. Create security event logging table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  business_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info', -- info, warning, critical
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only managers and business owners can view security events
CREATE POLICY "Managers can view security events"
ON public.security_events
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

-- System can insert security events
CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- 9. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid DEFAULT NULL::uuid,
  p_business_id uuid DEFAULT NULL::uuid,
  p_event_type text DEFAULT 'general'::text,
  p_event_description text DEFAULT ''::text,
  p_severity text DEFAULT 'info'::text,
  p_ip_address inet DEFAULT NULL::inet,
  p_user_agent text DEFAULT NULL::text,
  p_additional_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    business_id,
    event_type,
    event_description,
    severity,
    ip_address,
    user_agent,
    additional_data
  ) VALUES (
    COALESCE(p_user_id, auth.uid()),
    p_business_id,
    p_event_type,
    p_event_description,
    p_severity,
    p_ip_address,
    p_user_agent,
    p_additional_data
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;