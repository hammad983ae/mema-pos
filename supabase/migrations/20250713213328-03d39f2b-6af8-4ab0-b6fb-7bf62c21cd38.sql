-- Revert all businesses back to starter plan
UPDATE public.businesses 
SET 
  subscription_plan = 'starter',
  subscription_status = 'active';