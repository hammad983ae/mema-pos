
-- Add customer requirement setting to business settings
UPDATE public.businesses 
SET settings = COALESCE(settings, '{}'::jsonb) || '{"require_customer_for_checkout": false}'::jsonb
WHERE settings IS NULL OR NOT (settings ? 'require_customer_for_checkout');

-- Add a comment to document this setting
COMMENT ON COLUMN public.businesses.settings IS 'Business configuration settings including require_customer_for_checkout (boolean)';
