-- Update current user's business to enterprise plan for unlimited stores
UPDATE public.businesses 
SET 
  subscription_plan = 'enterprise',
  subscription_status = 'active'
WHERE owner_user_id = auth.uid();