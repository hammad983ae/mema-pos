-- Create store day sessions table to track when stores are open for business
CREATE TABLE public.store_day_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_by UUID NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE NULL,
  closed_by UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_cash_amount NUMERIC DEFAULT 0.00,
  closing_cash_amount NUMERIC NULL,
  total_sales NUMERIC DEFAULT 0.00,
  total_transactions INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one active session per store per day
  UNIQUE(store_id, session_date, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS on store day sessions
ALTER TABLE public.store_day_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for store day sessions
CREATE POLICY "Business members can view store day sessions"
ON public.store_day_sessions
FOR SELECT
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Business members can create store day sessions"
ON public.store_day_sessions
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() AND is_active = true
  )
  AND opened_by = auth.uid()
);

CREATE POLICY "Managers can manage store day sessions"
ON public.store_day_sessions
FOR UPDATE
USING (
  business_id IN (
    SELECT business_id 
    FROM public.user_business_memberships 
    WHERE user_id = auth.uid() 
      AND role IN ('business_owner', 'manager', 'office')
      AND is_active = true
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_store_day_sessions_updated_at
  BEFORE UPDATE ON public.store_day_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get or create active day session for a store
CREATE OR REPLACE FUNCTION public.get_or_create_store_day_session(
  p_store_id UUID,
  p_opened_by UUID,
  p_opening_cash_amount NUMERIC DEFAULT 0.00
)
RETURNS TABLE(
  session_id UUID,
  session_date DATE,
  opened_at TIMESTAMP WITH TIME ZONE,
  opened_by_name TEXT,
  is_new_session BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_session public.store_day_sessions%ROWTYPE;
  new_session_id UUID;
  business_id_val UUID;
  opener_name TEXT;
  is_new BOOLEAN := false;
BEGIN
  -- Get business_id from store
  SELECT s.business_id INTO business_id_val
  FROM public.stores s
  WHERE s.id = p_store_id;
  
  IF business_id_val IS NULL THEN
    RAISE EXCEPTION 'Store not found';
  END IF;
  
  -- Get opener name
  SELECT COALESCE(p.full_name, p.username, 'Unknown') INTO opener_name
  FROM public.profiles p
  WHERE p.user_id = p_opened_by;
  
  -- Check for existing active session for today
  SELECT * INTO existing_session
  FROM public.store_day_sessions sds
  WHERE sds.store_id = p_store_id
    AND sds.session_date = CURRENT_DATE
    AND sds.is_active = true;
  
  IF existing_session.id IS NOT NULL THEN
    -- Return existing session
    RETURN QUERY SELECT 
      existing_session.id,
      existing_session.session_date,
      existing_session.opened_at,
      opener_name,
      false;
  ELSE
    -- Create new day session
    INSERT INTO public.store_day_sessions (
      store_id,
      business_id,
      session_date,
      opened_by,
      opening_cash_amount
    ) VALUES (
      p_store_id,
      business_id_val,
      CURRENT_DATE,
      p_opened_by,
      p_opening_cash_amount
    ) RETURNING id INTO new_session_id;
    
    -- Return new session
    RETURN QUERY SELECT 
      new_session_id,
      CURRENT_DATE,
      now(),
      opener_name,
      true;
  END IF;
END;
$$;

-- Create function to close day session
CREATE OR REPLACE FUNCTION public.close_store_day_session(
  p_store_id UUID,
  p_closed_by UUID,
  p_closing_cash_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  session_record public.store_day_sessions%ROWTYPE;
BEGIN
  -- Get active session
  SELECT * INTO session_record
  FROM public.store_day_sessions
  WHERE store_id = p_store_id
    AND session_date = CURRENT_DATE
    AND is_active = true;
  
  IF session_record.id IS NULL THEN
    RAISE EXCEPTION 'No active day session found for this store';
  END IF;
  
  -- Close the session
  UPDATE public.store_day_sessions
  SET 
    closed_at = now(),
    closed_by = p_closed_by,
    closing_cash_amount = p_closing_cash_amount,
    notes = p_notes,
    is_active = false
  WHERE id = session_record.id;
  
  RETURN true;
END;
$$;