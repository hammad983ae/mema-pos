-- Remove sample data that was created in wrong businesses
-- Keep only the data that belongs to the intended demo business

-- Delete products that don't belong to the correct business
DELETE FROM public.inventory 
WHERE store_id IN (
  SELECT s.id FROM public.stores s
  WHERE s.business_id != (
    SELECT id FROM public.businesses 
    WHERE name = 'Mikes Business' 
    AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
  )
);

DELETE FROM public.products 
WHERE business_id != (
  SELECT id FROM public.businesses 
  WHERE name = 'Mikes Business' 
  AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
);

-- Delete stores that don't belong to the correct business  
DELETE FROM public.stores 
WHERE business_id != (
  SELECT id FROM public.businesses 
  WHERE name = 'Mikes Business' 
  AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
)
AND name IN ('Downtown Flagship', 'Westside Branch');

-- Delete business memberships for employees that don't belong to the correct business
DELETE FROM public.user_business_memberships 
WHERE business_id != (
  SELECT id FROM public.businesses 
  WHERE name = 'Mikes Business' 
  AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
)
AND role = 'employee';

-- Delete profiles that were created as sample employees
DELETE FROM public.profiles 
WHERE username IN ('sarah_j', 'alex_c', 'maria_g', 'james_w', 'emma_d', 'ryan_m', 'lisa_a', 'david_b', 'nicole_t')
AND user_id NOT IN (
  SELECT user_id FROM public.user_business_memberships 
  WHERE business_id = (
    SELECT id FROM public.businesses 
    WHERE name = 'Mikes Business' 
    AND owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
  )
);

-- Clean up duplicate businesses (keep only the intended ones)
DELETE FROM public.businesses 
WHERE name = 'Sarahs Spa' 
AND owner_user_id != 'adda5f43-e1a2-49da-868c-41105acba0c3';