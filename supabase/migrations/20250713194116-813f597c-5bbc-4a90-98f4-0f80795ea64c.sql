-- Clean up duplicate businesses and memberships for user adda5f43-e1a2-49da-868c-41105acba0c3
-- Keep only "Mikes Business" (089d17e4-f823-4e22-a980-ddd8d9d18869)

-- First, delete user_business_memberships for businesses we're about to delete
DELETE FROM public.user_business_memberships 
WHERE user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
  AND business_id != '089d17e4-f823-4e22-a980-ddd8d9d18869';

-- Delete the duplicate businesses (this will cascade to related data)
DELETE FROM public.businesses 
WHERE owner_user_id = 'adda5f43-e1a2-49da-868c-41105acba0c3'
  AND id != '089d17e4-f823-4e22-a980-ddd8d9d18869';