-- Fix existing users who have missing full_name or show as 'Unknown User'
-- Update profiles with proper names for existing users
UPDATE public.profiles 
SET full_name = COALESCE(
  (SELECT u.raw_user_meta_data ->> 'full_name' 
   FROM auth.users u 
   WHERE u.id = profiles.user_id),
  (SELECT u.raw_user_meta_data ->> 'name' 
   FROM auth.users u 
   WHERE u.id = profiles.user_id),
  (SELECT SPLIT_PART(u.email, '@', 1)
   FROM auth.users u 
   WHERE u.id = profiles.user_id),
  'Business Owner'
)
WHERE full_name IS NULL 
   OR full_name = '' 
   OR full_name = 'Business Owner';

-- Ensure business owners have proper role assignments
-- Find users who own businesses but don't have business_owner role
INSERT INTO public.user_business_memberships (user_id, business_id, role, is_active)
SELECT DISTINCT b.owner_user_id, b.id, 'business_owner'::user_role, true
FROM public.businesses b
LEFT JOIN public.user_business_memberships ubm ON (
  ubm.user_id = b.owner_user_id 
  AND ubm.business_id = b.id 
  AND ubm.role = 'business_owner'::user_role
)
WHERE ubm.id IS NULL
ON CONFLICT (user_id, business_id) 
DO UPDATE SET 
  role = 'business_owner'::user_role,
  is_active = true;