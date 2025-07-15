-- Create index for PIN lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_pos_pin ON public.profiles(pos_pin) WHERE pos_pin IS NOT NULL;

-- Create PIN attempts table for rate limiting (if not exists)
CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on pin_attempts
ALTER TABLE public.pin_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for PIN attempts (using IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pin_attempts' AND policyname = 'Users can view their own PIN attempts') THEN
    CREATE POLICY "Users can view their own PIN attempts"
      ON public.pin_attempts
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pin_attempts' AND policyname = 'System can insert PIN attempts') THEN
    CREATE POLICY "System can insert PIN attempts"
      ON public.pin_attempts
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;