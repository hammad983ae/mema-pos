-- Create missing business membership for the current user
INSERT INTO public.user_business_memberships (
  user_id,
  business_id,
  role,
  is_active
) 
SELECT 
  '089d17e4-f823-4e22-a980-ddd8d9d18869'::uuid as business_id,
  owner_user_id,
  'business_owner'::user_role,
  true
FROM public.businesses 
WHERE id = '089d17e4-f823-4e22-a980-ddd8d9d18869'
ON CONFLICT (user_id, business_id) DO UPDATE SET
  role = 'business_owner'::user_role,
  is_active = true;