-- Clean up any potential duplicate channel data to prevent future conflicts
-- Keep only the most recent channel for each business_id + name combination
WITH ranked_channels AS (
  SELECT 
    id,
    business_id,
    name,
    ROW_NUMBER() OVER (PARTITION BY business_id, name ORDER BY created_at DESC) as rn
  FROM public.channels
),
channels_to_delete AS (
  SELECT id FROM ranked_channels WHERE rn > 1
)
DELETE FROM public.channel_members 
WHERE channel_id IN (SELECT id FROM channels_to_delete);

WITH ranked_channels AS (
  SELECT 
    id,
    business_id,
    name,
    ROW_NUMBER() OVER (PARTITION BY business_id, name ORDER BY created_at DESC) as rn
  FROM public.channels
)
DELETE FROM public.channels 
WHERE id IN (SELECT id FROM ranked_channels WHERE rn > 1);