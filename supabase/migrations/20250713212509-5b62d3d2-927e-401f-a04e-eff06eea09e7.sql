-- Update business subscription plan to enterprise for unlimited stores
UPDATE public.businesses 
SET 
  subscription_plan = 'enterprise',
  subscription_status = 'active'
WHERE owner_user_id = auth.uid();