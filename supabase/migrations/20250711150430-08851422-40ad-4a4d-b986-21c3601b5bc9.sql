-- Step 1: Secure PIN storage and add rate limiting for authentication
-- First let's enhance PIN security which is critical

-- Create table for tracking PIN attempts
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on pin_attempts
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for pin attempts
CREATE POLICY "Users can view their own PIN attempts" 
ON public.pin_attempts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can log PIN attempts" 
ON public.pin_attempts FOR INSERT
WITH CHECK (true);

-- Create function to check PIN attempt rate limiting
CREATE OR REPLACE FUNCTION check_pin_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
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
    -- Check if last failed attempt was within the last hour
    IF last_attempt > now() - INTERVAL '1 hour' THEN
      RETURN false; -- Account locked
    END IF;
  END IF;
  
  RETURN true; -- Attempts allowed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log PIN attempts
CREATE OR REPLACE FUNCTION log_pin_attempt(p_user_id UUID, p_success BOOLEAN, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.pin_attempts (user_id, success, ip_address, user_agent)
  VALUES (p_user_id, p_success, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;