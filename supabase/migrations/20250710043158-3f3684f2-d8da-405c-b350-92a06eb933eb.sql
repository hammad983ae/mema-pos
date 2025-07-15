-- Add user_id column to commission_tiers table to support employee-specific tiers
ALTER TABLE public.commission_tiers 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for better performance when querying employee-specific tiers
CREATE INDEX idx_commission_tiers_user_id ON public.commission_tiers(user_id);

-- Add check constraint to ensure either role_type OR user_id is set, but not both
ALTER TABLE public.commission_tiers 
ADD CONSTRAINT check_tier_scope 
CHECK (
  (role_type IS NOT NULL AND user_id IS NULL) OR 
  (role_type IS NULL AND user_id IS NOT NULL)
);

-- Update the target_period to include daily option
ALTER TABLE public.commission_tiers 
DROP CONSTRAINT IF EXISTS commission_tiers_target_period_check;

ALTER TABLE public.commission_tiers 
ADD CONSTRAINT commission_tiers_target_period_check 
CHECK (target_period IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Create a function to get effective commission rate for a user based on their sales
CREATE OR REPLACE FUNCTION public.get_user_commission_rate(
  p_user_id UUID, 
  p_sales_amount NUMERIC, 
  p_period TEXT DEFAULT 'monthly'
) RETURNS NUMERIC AS $$
DECLARE
  user_business_id UUID;
  user_role TEXT;
  commission_rate NUMERIC := 0;
  tier_record RECORD;
BEGIN
  -- Get user's business and role
  SELECT ubm.business_id, p.position_type
  INTO user_business_id, user_role
  FROM public.user_business_memberships ubm
  JOIN public.profiles p ON p.user_id = ubm.user_id
  WHERE ubm.user_id = p_user_id AND ubm.is_active = true
  LIMIT 1;
  
  -- First try to find employee-specific tiers
  FOR tier_record IN
    SELECT commission_rate as rate
    FROM public.commission_tiers
    WHERE user_id = p_user_id 
      AND business_id = user_business_id
      AND target_period = p_period
      AND is_active = true
      AND p_sales_amount >= target_amount
    ORDER BY target_amount DESC
    LIMIT 1
  LOOP
    RETURN tier_record.rate;
  END LOOP;
  
  -- If no employee-specific tiers, fall back to role-based tiers
  FOR tier_record IN
    SELECT commission_rate as rate
    FROM public.commission_tiers
    WHERE role_type = user_role
      AND business_id = user_business_id
      AND target_period = p_period
      AND is_active = true
      AND user_id IS NULL
      AND p_sales_amount >= target_amount
    ORDER BY target_amount DESC
    LIMIT 1
  LOOP
    RETURN tier_record.rate;
  END LOOP;
  
  -- If no matching tiers found, return base rate (lowest tier for the user/role)
  SELECT commission_rate INTO commission_rate
  FROM public.commission_tiers
  WHERE (user_id = p_user_id OR (role_type = user_role AND user_id IS NULL))
    AND business_id = user_business_id
    AND target_period = p_period
    AND is_active = true
  ORDER BY 
    CASE WHEN user_id IS NOT NULL THEN 1 ELSE 2 END, -- Prioritize user-specific
    target_amount ASC
  LIMIT 1;
  
  RETURN COALESCE(commission_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;