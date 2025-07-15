-- Force update all businesses to enterprise plan as fallback
UPDATE public.businesses 
SET 
  subscription_plan = 'enterprise',
  subscription_status = 'active';