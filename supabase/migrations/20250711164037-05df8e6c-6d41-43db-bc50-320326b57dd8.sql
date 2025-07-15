-- PHASE 2 CONTINUED: Authentication Security (Missing pieces only)

-- Add missing PIN attempt policies
CREATE POLICY IF NOT EXISTS "Managers can view PIN attempts"
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

-- Update profiles table to store hashed PINs (safe to run multiple times)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pos_pin_hash TEXT;

-- Only drop pos_pin if it exists and pos_pin_hash has been added
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pos_pin') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pos_pin_hash') THEN
    ALTER TABLE public.profiles DROP COLUMN pos_pin;
  END IF;
END $$;

-- Create session management table
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

-- Enable RLS on sessions if table was just created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
    ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own sessions"
    ON public.user_sessions
    FOR SELECT
    USING (user_id = auth.uid());

    CREATE POLICY "System can manage sessions"
    ON public.user_sessions
    FOR ALL
    USING (true);
  END IF;
END $$;

-- Create security event logging table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  business_id UUID,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security events if table was just created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'security_events') THEN
    ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
    
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

    CREATE POLICY "System can insert security events"
    ON public.security_events
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;