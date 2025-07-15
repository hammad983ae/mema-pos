-- Update only the current user's business to enterprise plan for testing
UPDATE public.businesses 
SET 
  subscription_plan = 'enterprise',
  subscription_status = 'active'
WHERE owner_user_id = auth.uid();