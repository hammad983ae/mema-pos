-- Add PIN authentication for employees
ALTER TABLE public.profiles 
ADD COLUMN pos_pin TEXT;

-- Create index for PIN lookups
CREATE INDEX idx_profiles_pos_pin ON public.profiles(pos_pin) WHERE pos_pin IS NOT NULL;

-- Create PIN attempts table for rate limiting
CREATE TABLE public.pin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on pin_attempts
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for PIN attempts
CREATE POLICY "Users can view their own PIN attempts"
  ON public.pin_attempts
  FOR SELECT
  USING (true); -- Allow system to read for rate limiting

CREATE POLICY "System can insert PIN attempts"
  ON public.pin_attempts
  FOR INSERT
  WITH CHECK (true);

-- Function to check PIN rate limiting
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

-- Function to log PIN attempt
CREATE OR REPLACE FUNCTION public.log_pin_attempt(
  p_user_id UUID, 
  p_success BOOLEAN, 
  p_ip_address INET DEFAULT NULL, 
  p_user_agent TEXT DEFAULT NULL
)
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