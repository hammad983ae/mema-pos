-- Update specific user's business to enterprise plan for testing (using user UUID from auth context)
UPDATE public.businesses 
SET 
  subscription_plan = 'enterprise',
  subscription_status = 'active'
WHERE id IN (
  SELECT business_id 
  FROM user_business_memberships 
  WHERE user_id = auth.uid() AND is_active = true
);